const express=require("express");
const app=express();

const port=3000;

app.listen(port,()=>{
    console.log(`app is listening on port ${port}`);
});

app.get("/",(req,res)=>{
    res.send("PII Detector and Redactor Backend is running");
});