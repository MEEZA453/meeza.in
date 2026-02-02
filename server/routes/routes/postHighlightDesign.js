import express from 'express'
import {getHighlightDesign , postHighlightDesign , deleteHighlightDesign} from '../controller/highlightDesign.js'
const router = express.Router();


router.get('/' ,getHighlightDesign ) ;
router.post('/post' , postHighlightDesign) ;
router.delete('/delete' , deleteHighlightDesign) ;


export default router