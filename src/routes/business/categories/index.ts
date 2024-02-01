import { Request, Response, Router } from "express"
import { currentUserMiddleware } from "../../auth"
import { param } from "express-validator";

const router = Router()
interface SubCategory {
  defaultTime: { hours: number; minutes: number }
  price: number
  name: string
}

interface SubCategoriesRequest extends Request {
  body:{
    categories:string[]
  }
}


interface category {
  name: string
  subCategories: SubCategory[]
}

const categories: category[] = [
  {
    name: "מספרה",
    subCategories: [
      { defaultTime: { hours: 0, minutes: 30 }, price: 80, name: "תספורת גבר" },
      { defaultTime: { hours: 0, minutes: 40 }, price: 150, name: "תספורת אישה" },
      { defaultTime: { hours: 0, minutes: 10 }, price: 30, name: "זקן" },
      { defaultTime: { hours: 0, minutes: 20 }, price: 50, name: "פן" },
    ],
  },
  {
    name: "לק ג׳ל",
    subCategories: [
      { defaultTime: { hours: 1, minutes: 30 }, price: 150, name: "לק ג׳ל עם בנייה" },
      { defaultTime: { hours: 1, minutes: 30 }, price: 80, name: "בניית ציפורניים " },
      { defaultTime: { hours: 0, minutes: 10 }, price: 100, name: "לק ג׳ל" },
    ],
  },
  {
    name: "וטרינר",
    subCategories: [
      { defaultTime: { hours: 1, minutes: 30 }, price: 600, name: "עיקור/סירוס" },
      { defaultTime: { hours: 0, minutes: 15 }, price: 100, name: "בדיקה שגרתית " },
      { defaultTime: { hours: 0, minutes: 10 }, price: 100, name: "חיסון" },
      { defaultTime: { hours: 0, minutes: 10 }, price: 30, name: "גזירת ציפורניים" },
    ],
  },
]

router.get("/business/categories-options", 
// currentUserMiddleware,
 (req: Request, res: Response) => {


  res.status(200).json({ categories })
})


router.post("/business/sub-categories-options", 

// currentUserMiddleware,
 (req: SubCategoriesRequest, res: Response) => {
  const bodyCategories = req.body?.categories
  console.log('bodyCategories ', bodyCategories)


  const subCategories:SubCategory[][] = []
  for(let i = 0; i<categories.length; i ++) {
    const categoryIndex = categories.findIndex(category => category.name === bodyCategories[i])
    if(categoryIndex >=0) subCategories.push(categories[categoryIndex].subCategories)
  }
  res.status(200).json({ subCategories })
})




export default router
