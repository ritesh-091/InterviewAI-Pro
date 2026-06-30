const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument();
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const outputPath = path.join(uploadsDir, 'sample_resume.pdf');
const stream = fs.createWriteStream(outputPath);

doc.pipe(stream);

doc.fontSize(22).text('John Candidate', 50, 50);
doc.fontSize(12).text('Email: john.candidate@university.edu | Phone: +1-555-0199', 50, 80);
doc.text('GitHub: github.com/johncandidate | LinkedIn: linkedin.com/in/johncandidate', 50, 95);

doc.fontSize(16).text('Professional Summary', 50, 130);
doc.fontSize(10).text('Enthusiastic and results-driven Junior Software Engineer with hands-on experience building modern, responsive web applications. Proven capabilities in data structures, front-end state managers, and REST API development.', 50, 150, { width: 500 });

doc.fontSize(16).text('Technical Skills', 50, 200);
doc.fontSize(10).text('Languages: JavaScript (ES6+), Python, SQL, HTML5, CSS3\nFrameworks & Libraries: React.js, Express.js, Node.js, Tailwind CSS\nDatabases: MongoDB, PostgreSQL\nTools & Platforms: Git, Docker, GitHub Actions', 50, 220);

doc.fontSize(16).text('Experience', 50, 280);
doc.fontSize(12).text('Junior Web Developer - TechCorp Solutions (2025 - Present)', 50, 300);
doc.fontSize(10).text('- Collaborated in team assemblies to construct reusable React components, improving loading times.\n- Built and maintained secure backend endpoints using Express.js and MongoDB.', 50, 315);

doc.end();

stream.on('finish', () => {
  console.log('Sample resume PDF created successfully at:', outputPath);
});
