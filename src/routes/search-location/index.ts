import express, { Request, Response, text } from 'express'
import { pool } from '../../db'
import axios from 'axios'

const router = express.Router()

router.get('/search-location', async(req:Request,res:Response) => {
    const input = req.query.input
    if(!input) return res.json({}).status(400)


    try {
        const [rows] = await pool.execute('SELECT * FROM locations WHERE text = ?',[input])
        const storedLocations = rows as Record<string,any>
        if(!storedLocations.length) {

        console.log('fetch from google places ')
          const response =  await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=AIzaSyA0puLIR9nfTrgLHUuwmoewVYzDLB_kSFU`)
            const locations = response.data.predictions.map((item:Record<string,string>) => item.description)
            const stringifyLocations = JSON.stringify(locations)

            await pool.execute('INSERT INTO locations (id, timestamp, text, results) VALUES (?, ?, ?, ?) ',
            [
            crypto.randomUUID(),
            new Date(),
            input,
            stringifyLocations
        ])
        return res.status(201).json({locations})
        }
        else {
            
            console.log('from cache!!', storedLocations[0].results)
           return res.status(200).json({locations:JSON.parse(storedLocations[0].results)})}

    }catch(err) {
        console.log('err ', err)
        return res.json({}).status(500)
    }
})


export default router
