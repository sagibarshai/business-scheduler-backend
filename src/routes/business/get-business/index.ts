import { Request, Response, Router } from "express";
import { currentUserMiddleware } from "../../auth";
import { pool } from "../../../db";

const router = Router();

router.get('/business', currentUserMiddleware, async (req: Request, res: Response) => {
    console.log('this route is fine in the head ?!?!?')
    try {
        const user = req.user!;

        // Fetch business data
        const [businessDataRows] = await pool.execute(`SELECT * FROM business_data WHERE ID = ?`, [user.id]);
        //@ts-ignore
        const businessData = businessDataRows?.map((row: any) => ({
            id: row.id,
            address: row.address,
            business_name: row.business_name,
            category: row.category,
            working_days_and_hours: JSON.parse(row.working_days_and_hours),
            phone: row.phone,
            sub_categories: JSON.parse(row.sub_categories),
            business_description: row.business_description,
            employees_id: row.employees_id,
            timestamp: row.timestamp,
            updated_at: row.updated_at
        })) || [];

        // Fetch business images
        const [businessImgsRows] = await pool.execute('SELECT * FROM business_images WHERE id = ?', [user.id]);
              //@ts-ignore

        const businessImgs = businessImgsRows?.map((row: any) => ({
            id: row.id,
            file_type: row.file_type,
            base64: row.base64,
            size: row.size,
            img_type: row.img_type,
            timestamp: row.timestamp,
            updated_at: row.updated_at
        })) || [];

        // Check if data exists, if not, return 400
        if (businessData.length === 0 || businessImgs.length === 0) {
            return res.status(400).json({ error: "No data found" });
        }

        // Send back the response
        res.json({ businessData: businessData[0], businessImgs });
    } catch (error) {
        console.error("Error fetching business data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
