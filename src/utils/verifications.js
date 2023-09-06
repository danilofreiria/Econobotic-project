import {pool} from "../config/pool.js"
import { invalidEmail } from "./messages.js";
import express from "express"

const verifyItens = (item) => !item;

const verifyEmail = async (email, id) => {
    try {
        const query = "select *from usuarios where email = $1 and id != $2";
        const values = [email, id];
        const existEmail = await pool.query(query, values);
    
        return existEmail.rowCount === 0;
    } catch (error) {
        console.log(error.message);
        throw error;
        
    }
}

const verifyIdFromParams = (id) => {
    if (!id) {return false};
    return !isNaN(id) && Number.isInteger(id);
}


export { verifyItens, verifyEmail, verifyIdFromParams}