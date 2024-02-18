import { Request, Response, Router } from "express";
import { SubCategory } from "../categories";
import { currentUserMiddleware } from "../../auth";
import { pool } from "../../../db";

const router = Router();

export interface Img {
    file_type: 'jpeg' | 'jpg' | 'png';
    base64: string;
    size: string;
    img_type: 'profile' | 'cover' | 'regular';
}

export type Days = {
    name: string;
    longName: string;
}[];

export type DaysAndHours = {
    days: Days;
    from: string;
    to: string;
}

export type SelectedHoursAndDays = DaysAndHours[];

interface RegisterBusinessRequest extends Request {
    body: {
        address: string;
        category: string;
        name: string;
        workingDayAndHours: SelectedHoursAndDays;
        phone: string;
        subCategories: SubCategory[];
        description?: string;
        profileImg: Img;
        coverImg?: Img;
        regularImgs?: Img[];
    };
}

router.post('/business/register', currentUserMiddleware, async (req: RegisterBusinessRequest, res: Response) => {
    const user = req.user!;
    const { address, category, name, phone, profileImg, subCategories, workingDayAndHours } = req.body;
    const description = req.body.description;
    const coverImg = req.body.coverImg;
    const regularImgs = req.body.regularImgs;


    if (!address || !phone || !category || !name || !profileImg || !subCategories.length || !workingDayAndHours.length) 
        return res.status(400).json({ message: 'Not valid' });
  
    try {

        let query = '';
        let params: any[] = [];
        const [existingBusinessData] = await pool.execute(`SELECT * FROM business_data WHERE id = ?`, [user.id]);
        const currentTimeStamp = new Date();
        //@ts-ignore
        if (existingBusinessData?.length > 0) {
            query = `UPDATE business_data SET address = ?, business_name = ?, category = ?, working_days_and_hours = ?, phone = ?, sub_categories = ?, business_description = ?, updated_at = ? WHERE id = ?`;
            params = [address, name, category, JSON.stringify(workingDayAndHours), phone, JSON.stringify(subCategories), description || 'N/A', currentTimeStamp, user.id];
        } else {
            query = `INSERT INTO business_data (id, address, business_name, category, working_days_and_hours, phone, sub_categories, business_description, employees_id, timestamp, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            params = [user.id, address, name, category, JSON.stringify(workingDayAndHours), phone, JSON.stringify(subCategories), description || 'N/A', 'N/A', currentTimeStamp, currentTimeStamp];
        }

        await pool.execute(query, params);
    } catch (err) {
        console.log('Error updating/inserting business data:', err);
        return res.status(500).json({ message: 'Error updating/inserting business data' });
    }

    try {
        await updateOrInsertImage(user.id, profileImg, 'profile');

        if (coverImg) await updateOrInsertImage(user.id, coverImg, 'cover');

        await pool.execute(`DELETE FROM business_images WHERE id = ? AND img_type = 'regular'`, [user.id]);
        if (regularImgs?.length) {
            // Delete all existing regular images associated with the user ID
            
            // Insert each regular image from the array individually
            for (const img of regularImgs) {
                await updateOrInsertImage(user.id, img, 'regular');
            }
        }
    } catch (err) {
        console.log('Error updating/inserting images:', err);
        return res.status(500).json({ message: 'Error updating/inserting images' });
    }

    return res.status(201).json({ message: "ok" });
});

async function updateOrInsertImage(userId: string, img: Img, imgType: 'profile' | 'cover' | 'regular') {
    try {
        const currentTimeStamp = new Date();

        if(img.img_type !=='regular') {
            // profile and cover imgs
            
            const [existingImage] = await pool.execute(`SELECT * FROM business_images WHERE id = ? AND img_type = ?`, [userId, imgType]);

            //@ts-ignore
            if (existingImage?.length > 0) {
                await pool.execute(`UPDATE business_images SET type = ?, base64 = ?, size = ?, updated_at = ? WHERE id = ? AND img_type = ?`, [
                    img.file_type, img.base64, img.size, currentTimeStamp, userId, imgType
                ]);
            } else {
                await pool.execute(`INSERT INTO business_images (id, type, base64, size, img_type, timestamp, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    userId, img.file_type, img.base64, img.size, imgType, currentTimeStamp, currentTimeStamp
                ]);
            }
        }
        else {
                await pool.execute(`INSERT INTO business_images (id, type, base64, size, img_type, timestamp, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    userId, img.file_type, img.base64, img.size, imgType, currentTimeStamp, currentTimeStamp
                ]);

        }
        } catch (err) {
            console.log('Error updating/inserting image:', err);
            throw err;
        }
}


export default router;
