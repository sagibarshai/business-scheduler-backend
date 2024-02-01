import express, { Request, Response } from 'express'
import { pool } from '../../db'
import { currentUserMiddleware } from '../auth'
import { User } from '../auth/types'
import { body } from 'express-validator'

const router = express.Router()


interface SetRoleRequest extends Request  {
    body:{
        role:User['role']
    } 
}


router.put('/user/set-role' ,body('role').exists() , currentUserMiddleware,async(req:SetRoleRequest,res:Response) => {
    const role = req.body.role
    const user = req.user
    if(!user) return res.status(401).json({})

    if(role === 'business' || role === 'employee' || role === 'guest' || role=== 'user') {
        try {
            const [rows] = await pool.execute('UPDATE users SET role = ? WHERE id = ? ', [role,user.id])
            
            return res.status(201).json({})

        }
        catch(err) {
            console.log('err ', err)
            return res.status(500).json({})
        }
    }
    else return res.status(400).json({})
    
})



export default router
