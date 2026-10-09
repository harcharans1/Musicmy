import {Router} from "express";
import {listFaqs,listBlog,getBlog,contact} from "../controllers/contentController.js";
const r=Router(); r.get("/faqs",listFaqs); r.get("/blog",listBlog); r.get("/blog/:slug",getBlog); r.post("/contact",contact); export default r;
