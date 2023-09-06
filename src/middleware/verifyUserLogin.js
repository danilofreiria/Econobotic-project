import jwt from "jsonwebtoken";
import { pool } from "../config/pool.js";
import { unauthorized } from "../utils/messages.js";
import dotenv from "dotenv";
dotenv.config();

const verifyUserLogin = async(req, res, next) => {
    const {authorization} = req.headers;

    if (!authorization) {
        return res.status(401).json({ mensagem: unauthorized });
    }

    const token = authorization.split(" ")[1];

    try {
        const key = process.env.jwtPassword;
        const {id} = jwt.verify(token, key);

        const query = "select * from usuarios where id = $1";
        const values = [id];
            
        const {rows, rowCount} = await pool.query(query, values);

        if (rowCount < 1) { 
            return res.status(401).json({ mensagem: unauthorized });
        }
        
        req.user = rows[0];

        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ mensagem: unauthorized });
        
    }
}


export {verifyUserLogin};