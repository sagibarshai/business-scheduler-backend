import express, { Request, Response, text } from 'express'
import { pool } from '../../db'
import axios from 'axios'
import { currentUserMiddleware } from '../auth'

const router = express.Router()

const googlePlacesKey = process.env.google_places_api_key
if(!googlePlacesKey) throw new Error('google_places_api_key must be defied')

router.get('/search-location',
//  currentUserMiddleware,
  async(req:Request,res:Response) => {
    const input = req.query.input
    if(!input) return res.status(400).json({})
    try {
        const [rows] = await pool.execute('SELECT * FROM locations WHERE text = ?',[input])
        const storedLocations = rows as Record<string,any>
        if(!storedLocations.length) {
            const response =  await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${googlePlacesKey}`)
            const locations = response.data.predictions.map((item:Record<string,string>) => item.description)
            const stringifyLocations = JSON.stringify(locations)
            if(!response.data.error_message) {
                console.log('fetch from google places ', response.data.error_message)
                await pool.execute('INSERT INTO locations (id, timestamp, text, results) VALUES (?, ?, ?, ?) ',
                [
                    crypto.randomUUID(),
                    new Date(),
                    input,
                    stringifyLocations
                ])
                return res.status(201).json({locations})
            }
            else return res.status(500).json({})
        }
        else {
            console.log('from cache', storedLocations[0].results)
           return res.status(200).json({locations:JSON.parse(storedLocations[0].results)})}

    }catch(err) {
        console.log('err ', err)
        return res.status(500).json({})
    }
})


export default router
