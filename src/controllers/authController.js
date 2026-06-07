import {User} from "../models/user.js";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import {Session} from "../models/session.js";
import {createSession, setSessionCookies} from "../services/auth.js";
import {sendMail} from "../utils/sendMail.js";
import jwt from 'jsonwebtoken'
import handlebars from "handlebars";
import fs from "node:fs/promises";
import path from "node:path";

export const registerUser = async (req, res) => {
    const existingUser = await User.findOne({email: req.body.email})
    if (existingUser) {
        throw createHttpError(400, "Email in use");
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const newUser = await User.create({
        email: req.body.email,
        password: hashedPassword
    })

    const session = await createSession(newUser._id)
    setSessionCookies(res, session)
    res.status(201).json(newUser);
}

export const loginUser = async (req, res) => {
    const user = await User.findOne({email: req.body.email,});
    if (!user) {
        throw createHttpError(401, 'Invalid credentials');
    }
    const isValidPass = await bcrypt.compare(req.body.password, user.password)
    console.log('isValidPass', isValidPass)
    if (!isValidPass) {
        throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteOne({userId: user._id})

    const session = await createSession(user._id)
    setSessionCookies(res, session)


    res.status(200).json(user);
}

export const logoutUser = async (req, res) => {
    if (req.cookies.sessionId) {
        await Session.deleteOne({_id: req.cookies.sessionId})
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');

    res.status(204).send()
}

export const refreshUserSession = async (req, res) => {
    const {sessionId, refreshToken} = req.cookies;
    if (!sessionId || !refreshToken) {
        throw createHttpError(401, 'Session not found')
    }

    const session = await Session.findOne({
        _id: sessionId,
        refreshToken
    })

    if (!session) {
        throw createHttpError(401, 'Session not found')
    }

    const isRefreshTokenExpired = session.refreshTokenValidUntil < new Date();
    if (isRefreshTokenExpired) {
        await session.deleteOne();
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('sessionId');

        throw createHttpError(401, 'Session token expired')
    }
    await session.deleteOne();
    const newSession = await createSession(session.userId)
    setSessionCookies(res, newSession)


    res.status(200).json({
        message: "Session refreshed"
    })
}

export const requestResetEmail = async (req, res) => {
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        return res.status(200).json({message: "Password reset email sent successfully"})
    }

    const resetToken = jwt.sign({
        email: req.body.email,
        sub: user._id,
    }, process.env.JWT_SECRET, {expiresIn: '15m'})
    console.log(resetToken)

    // 1. Формуємо шлях до шаблона
    const templatePath = path.resolve('src/templates/reset-password-email.html');
    // 2. Читаємо шаблон
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    // 3. Готуємо шаблон до заповнення
    const template = handlebars.compile(templateSource);
    // 4. Формуємо із шаблона HTML документ з динамічними даними
    const html = template({
        name: user.username,
        link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
    });


    try {
        await sendMail({
            from: process.env.SMTP_FROM,
            to: req.body.email,
            subject: "Reset your password",
            html
        })
    } catch (err) {
        console.log(err);
        throw createHttpError(500, 'Failed to send the email, please try again later.')
    }


    res.status(200).json({
        message: "Password reset email sent successfully"
    })
}

export const resetPassword = async (req, res) => {

    let payload;
    try {
        payload = jwt.verify(req.body.token, process.env.JWT_SECRET)
    } catch (err) {
        throw createHttpError(401, "Invalid or expired token")
    }

    const user = await User.findOne({
        _id: payload.sub,
        email: payload.email,
    });

    if (!user) {
        throw createHttpError(404, "User not found")
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    await User.updateOne({_id: user._id}, {password: hashedPassword})
    await Session.deleteMany({userId: user._id})

    res.status(200).json({message: "Password reset successfully"})
}