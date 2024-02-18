import { Request, Response, Router } from "express";
import { currentUserMiddleware } from "../../auth";
import { pool } from "../../../db";

const router = Router();

router.get('/business', currentUserMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;

        // Fetch business data
        const [businessDataRows] = await pool.execute(`SELECT * FROM business_data WHERE ID = ?`, [user.id]);

        //@ts-ignore
        const businessData = businessDataRows?.map((row: any) => ({
            id: row.id,
            address: row.address,
            name: row.business_name,
            category: row.category,
            workingDaysAndHours: JSON.parse(row.working_days_and_hours),
            phone: row.phone,
            subCategories: JSON.parse(row.sub_categories),
            description: row.business_description,
            employees_id: row.employees_id,
            timestamp: row.timestamp,
            updated_at: row.updated_at
        })) || [];

        // Fetch business images
        const [businessImgsRows] = await pool.execute('SELECT * FROM business_images WHERE id = ?', [user.id]);

        // images
        let cover;
        let profile;
        const regular = [];
        
        //@ts-ignore
        for (const row of businessImgsRows) {

            const img = {
                    id: row.id,
                    type: row.type,
                    base64:row.base64,
                    size: row.size.toString(),
                    img_type: row.img_type,
                    timestamp: row.timestamp,
                    updated_at: row.updated_at
                };
        
                if (img.img_type === 'cover') {
                    cover = img;
                } else if (img.img_type === 'profile') {
                    profile = img;
                } else if (img.img_type === 'regular') {
                    regular.push(img);
                }
            
        }


        if (businessData.length === 0 || (!profile )) {
            return res.status(400).json({ error: "No data found" });
        }

        res.json({ businessData: businessData[0], businessImgs: { cover, profile, regular } });
    } catch (error) {
        console.log("Error fetching business data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
