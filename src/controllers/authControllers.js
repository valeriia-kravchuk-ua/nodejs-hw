import {User} from "../models/user.js";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import {Session} from "../models/session.js";
import {createSession, setSessionCookies} from "../services/auth.js";

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