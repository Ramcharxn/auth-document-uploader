const jwt = require("jsonwebtoken");

module.exports = async (req,res,next) => {
    try {
        const token = req.headers["authorization"].split(" ")[1];
        jwt.verify(token,process.env.JWT_SECRET_KEY, (err, decoded) => {
            if(err){
                return res.status(401).send({message:"Auth Failed", success: false, err});
            }
            else {
                // req.body.userId = decoded.id;
                next();
            }
        });
    } catch (error) {
        return res.status(404).send({message: "Auth Failed", success: false, error});
    }
};