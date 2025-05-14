const About = require("../about/about")

exports.createAbout = async (req, res)=>{
    try {
       
        const {message, firstName, lastName, phoneNumber} = req.body;
        
      
        const result = await About({
            firstName,
            lastName,
            phoneNumber,
            message
        })
        result.save();
        console.log(result);
		return res.status(200).json({
			success: true,
			message: "message send Successfully",
		});
    } catch (error) {
        return res.status(500).json({
			success: true,
			message: error.message,
		});
    }
}