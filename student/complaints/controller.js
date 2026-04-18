// const {
//   createComplaint,
//   getStudentComplaints
// } = require("./service");

// // POST /student/complaints
// async function postComplaint(req, res) {
//   try {
//     const auth_id = req.user.auth_id;
//     const { message, anonymous, category, priority } = req.body;

//     if (!message) {
//       return res.status(400).json({ message: "Message is required" });
//     }

//     const complaint = await createComplaint(auth_id, {
//       message,
//       anonymous,
//       category,
//       priority
//     });

//     return res.status(201).json(complaint);

//   } catch (err) {
//     console.error("CREATE COMPLAINT ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // GET /student/complaints
// async function getMyComplaints(req, res) {
//   try {
//     const auth_id = req.user.auth_id;

//     const complaints = await getStudentComplaints(auth_id);

//     return res.status(200).json(complaints);

//   } catch (err) {
//     console.error("FETCH COMPLAINT ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// module.exports = {
//   postComplaint,
//   getMyComplaints
// };