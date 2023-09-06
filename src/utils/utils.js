import bcrypt from "bcrypt";

const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.log(error.message);
        throw error; 
    }
}

const validPassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.log(error.message);
        throw error; 
    }
}


export {hashPassword, validPassword}