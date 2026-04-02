'use strict'

/**
 * One-time seed script: inserts ForumEvent and DepartmentActivityLog records for DEP001 / biet-college.
 * Usage: node scripts/seed-dept-activities.js
 * Requires MONGODB_URI in .env
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { ulid }  = require('../src/layers/common/node_modules/ulid')

// ── Models (inline) ──────────────────────────────────────────────────────────

const ForumEventSchema = new mongoose.Schema({
  forum_event_id: { type: String, index: true },
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  title:          { type: String, required: true },
  description:    { type: String },
  attachmentUrl:  { type: String },
}, { timestamps: true })

const DepartmentActivityLogSchema = new mongoose.Schema({
  dept_activity_log_id: { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  text:                 { type: String, required: true },
}, { timestamps: true })

const ForumEvent          = mongoose.model('ForumEvent',            ForumEventSchema)
const DepartmentActivity  = mongoose.model('DepartmentActivityLog', DepartmentActivityLogSchema)

// ── Constants ─────────────────────────────────────────────────────────────────
const TENANT_ID  = 'biet-college'
const DEPT_ID    = 'DEP001'
const CREATED_BY = 'seed-script'

// ── Forum Events ──────────────────────────────────────────────────────────────
const FORUM_EVENTS = [
  {
    title: 'Code Quest 2.0',
    description: 'The Department under UniCS - Binary Blooms Coding Club conducted "Code Quest 2.0", an inter-collegiate coding competition on 30th October 2025.',
  },
  {
    title: "Fresher's Day",
    description: "Dept. of CSE organised Forum Inauguration and Fresher's Day on September 25th 2025.",
  },
  {
    title: 'SAMAGANA 1.0',
    description: 'The UniCS Cultural Club of the Department organized a Jamming session titled "SAMAGANA 1.0" on 17th October 2025.',
  },
  {
    title: 'Farewell',
    description: 'Department of CSE organises Farewell for 8th semester students on 2nd May 2025.',
  },
  {
    title: 'TCS Techbytes – Inter-Department Quiz',
    description: 'CSE department organized TCS Techbytes – Inter-Department Quiz on March 10th, 2025. The event aimed to promote technical knowledge and cross-department interaction among students.',
  },
  {
    title: 'UniCS Inauguration and Fresher\'s Day for batch 2022-26',
    description: 'The Department of Computer Science and Engineering is organizing the inauguration of a forum (UniCS) and Fresher\'s Day for students joining the 2022-26 batch.',
  },
  {
    title: 'CQuest 2.0',
    description: 'The Department of Computer Science and Engineering organizes CQuest2.0 competition. The Event is conducted to celebrate innovation and challenge technical skills of students.',
  },
  {
    title: 'Technical Talk on NLP Applications',
    description: 'Department of Computer Science and Engineering organizes Technical Talk on "From Toolkit to Transformation: NLP Applications Explored with Natural Language Toolkit".',
  },
  {
    title: 'FOOD WALK',
    description: 'The "FOOD WALK" activity on January 6, 2024, specifically tailored for 3rd-semester students. The event encouraged students to explore the rich culinary tapestry of Karnataka by sampling diverse cuisines from various districts.',
  },
  {
    title: 'Code Quest 1.0',
    description: 'Code Quest 1.0 — Date: 25th October 2024, Time: 9:00 AM onwards, Venue: Aryabhatta Seminar Hall.',
  },
  {
    title: '42nd Graduation Day',
    description: '42nd Graduation Day — Date: Saturday, 28th September 2024, Time: 10:30 AM onwards, Venue: SSM Cultural Centre, BIET Campus.',
  },
  {
    title: 'Alumni Meet 2024',
    description: 'Alumni Meet 2024 celebrating the Silver Jubilee Batch of 1999. Date: Saturday, 21st December 2024, Time: 9:30 AM onwards, Venue: SSM Cultural Centre, BIET Campus. Panel Discussion on "Overseas Prep, Job Interviews & Career Growth".',
  },
  {
    title: "FRESHER'S DAY 2024",
    description: "FRESHER'S DAY — Date: 8th October 2024, Time: 9:00 AM onwards, Venue: SSM Cultural Centre, BIET Campus.",
  },
  {
    title: 'TEKHACK-2023',
    description: 'TEKHACK-2023 — Inter-Institutional National Level Technology Hackathon organized by Dept. of CSE on 25/03/2023.',
  },
  {
    title: 'PROGYAN 5.0',
    description: 'Progyan 5.0 Open-House Project Exhibition organized on 4th and 5th of May 2023.',
  },
  {
    title: 'NSS Camp',
    description: 'A three-day NSS Camp at Kondajji, focusing on fostering social connection and responsibility, from March 16th to March 18th, 2023, for third-semester students.',
  },
  {
    title: 'Heritage Walk',
    description: 'Heritage walk for Hampi in view of Social Connect and responsibility for III Semester Students held on 17/02/2023.',
  },
  {
    title: 'TCS Tech-Bytes 2023',
    description: 'TCS TechBytes IT quiz competition open to all stream students, hosted by Dept. of CS&E, BIET, organized on 15/02/2023.',
  },
  {
    title: 'Internal Hackathon for MANTHAN-2023',
    description: 'The Department of CSE organized an Internal Hackathon to select top teams to participate in MANTHAN-2023 on Friday 27/01/2023.',
  },
  {
    title: 'Workshop on Tech-O-Net',
    description: 'One Day workshop conducted on Tech-O-Net on 13/01/2023 for 5th semester CSE students.',
  },
  {
    title: 'Workshop on Artificial Intelligence and Machine Learning',
    description: '3 days workshop for 7th semester students on Artificial Intelligence and Machine Learning organized from 03/01/2023 to 05/01/2023.',
  },
  {
    title: 'Workshop on Cyber Security & Ethical Hacking',
    description: '2 days workshop on Cyber Security & Ethical Hacking under UniCS for 45 girl students of Batch-I, 5th semester from 16/12/2022 to 17/12/2022, in association with Cybersapiens.',
  },
  {
    title: 'Workshop on Modern Database Application',
    description: 'Workshop on Techniques and Strategies Recipes for building a Modern Database Application to 5th semester of CSE organized on 14/12/2022.',
  },
  {
    title: 'Java Bootcamp + Hackathon',
    description: 'Java bootcamp + hackathon, one week program for 5th semester CSE students held from 06/12/2022 to 10/12/2022.',
  },
  {
    title: 'Youth Talk Day',
    description: 'Youth Talk Day was held on 31/10/2022 by Mr. Jackaulla, Microsoft Certified Expert from ICT Academy to CSE students.',
  },
  {
    title: 'Orientation Session on CLOUD AND DEVOPS LAB',
    description: 'Orientation Session for CSE faculties on CLOUD AND DEVOPS LAB on 15/10/2022 by Mr. Santosh Navale, Director, Fresher Profiles Private Ltd, Bengaluru.',
  },
  {
    title: 'CODE-A-THAN 2.0',
    description: 'Bootcamp and competition for 4th semester students on problem solving through programming organized from 04/08/2022 to 06/08/2022.',
  },
  {
    title: 'LATEX Workshop',
    description: 'A workshop for second and third year students of Computer Science and Engineering held on 07/06/2022.',
  },
  {
    title: 'Crash Course on C++',
    description: 'One week crash course on C++ for 4th semester students organized from 23/05/2022 to 27/05/2022.',
  },
  {
    title: 'Interactive Session on Challenges in IT Industries',
    description: 'Interactive Session on Challenges faced in IT Industries organized by department of Computer Science & Engineering on 04/05/2022.',
  },
  {
    title: 'Oracle Cloud Infrastructure',
    description: 'Self learning program by Oracle in association with ICT academy organized on 28/04/2022.',
  },
  {
    title: 'Progyan 4.0',
    description: 'Final year project phase-2 demo held on 21/04/2022 and 22/04/2022.',
  },
  {
    title: 'UNICS Coding Club Contest',
    description: 'Coding Contest using HackerRank organized from 06/12/2021 to 07/12/2021.',
  },
  {
    title: 'Session on Resume Building',
    description: 'Session on Resume Building by Mr. Thippeswamy G, Senior Software Engineer, Nutanix India Pvt. Ltd. Bengaluru, organized on 10/11/2021.',
  },
  {
    title: 'Soft Skills Training Program',
    description: 'Soft skills training program for pre final year students from 30/08/2021 to 04/09/2021.',
  },
  {
    title: 'Crack the Code to Conquer the Interview',
    description: 'Crack the Code to Conquer the Interview under CS forum from 31/07/2021 to 01/08/2021.',
  },
  {
    title: 'Progyan 3.0',
    description: 'Progyan-3.0: In-house project exhibition from 09/07/2021 to 10/07/2021.',
  },
  {
    title: 'Virtual Power Seminar on Industry 4.0',
    description: 'Virtual Power Seminar on Industry 4.0 on Employers Expectation on Fresh Engineering Graduates organized on 22/05/2021.',
  },
  {
    title: 'Faculty Lecture Series Conclave',
    description: 'Faculty Lecture Series Conclave in association with ISTE faculty chapter from 07/04/2021 to 30/04/2021.',
  },
  {
    title: 'BLOG-A-THON',
    description: 'The Blog-A-Thon event was held on 25/03/2021 for all faculty members of the institute to build their personal blogs as a new teaching pedagogy initiative.',
  },
]

// ── Department Activities ─────────────────────────────────────────────────────
const DEPT_ACTIVITIES = [
  "The Dept. of CS&E organised 5-Days Faculty Development Program on Cyber Security from 15th to 19th December, 2025.",
  "In association with the BIET Sports Club, the department organized the inauguration of the Annual Sports Event 'BIET Athletic Meet' for BIET students on 4th December 2025.",
  "The Department of CSE conducted OPTICODE, a coding challenge aimed at enhancing students' problem-solving skills across all CS-allied branches of BIET, held on 26th November 2025.",
  "The Department of CSE organized a 'Hedera Developer Program' workshop on 24th and 25th November 2025 at the institute level for all 5th-semester students.",
  "The Department of CS&E organized a two-days workshop on 'Hybrid Application Development using Flutter and Dart' for 5th semester students on 13th and 14th November 2025.",
  "The Dept. of CS&E conducted FDP on 'AI for Future Workforce' organized by the Software Technology Parks of India (STPI) in association with Vision Davangere and BIET on 15th October 2025.",
  "Dept. of CS&E conducted Student Development Program on 'AI for Future Workforce' organized by the Software Technology Parks of India (STPI) in association with Vision Davangere and BIET, held on 16th October 2025.",
  "An Alumni Meet for the 1988 to 1995 graduating batches, spanning a memorable one decade, was held on 27th September 2025.",
  "The Department of Computer Science and Engineering, in association with ICT Academy and sponsored by Infosys Foundation, organized the inauguration of the CSR Initiative – Certification Course on Python Web Developer on 15th September 2025.",
  "The Department of CSE organised Student Enablement Program on Building Project using Raspberry PI on 17th September 2025.",
  "The Department of CSE organized a CSR initiative sponsored by the Infosys Foundation in association with the ICT Academy, offering training program on 'Python Web Developer' from 1st to 18th September 2025.",
  "An In-house internship on Aptitude Training Programme was organized for the 3rd semester CSE students from 1st to 13th September 2025, in association with QSpiders, Bengaluru.",
  "The Workshop on 'Store Smarter, Query Faster: The MongoDB Way' was organised for 7th semester students on 22nd and 23rd August 2025.",
  "A Skill Development Program on Full Stack Development with Java was organized for 5th Semester students from 18th to 29th August 2025.",
  "Bootcamp and Hackathon on Agentic AI and Generative AI exclusively for 5th semester CSE students on 4th July 2025.",
  "Department of Computer Science and Engineering organised 'Faculty Conclave 2.0' for all CSE faculty members from 7th to 12th July 2025.",
  "In celebration of Hon. Secretary Dr. Shamanur Shivashankarappa ji's 95th Birthday, a Plantation Ceremony was held on 16th June 2025 near Amrutha Hostel. Faculties of the CSE Department actively participated.",
  "Professors of CSE department attended MindMatrix Conclave on Generative AI for VTU Engineering on 9th June 2025.",
  "Department of CSE organised workshop on AI Enabled Office Assistance tools on 3rd March 2025.",
  "Department of CSE organised Skill Development Program on Advanced Data Structures and Algorithms for 6th semester students.",
  "Department of CSE organised Workshop on GREEN AND AI EXPERTISE from 5th to 9th May 2025.",
  "Department of CSE organised workshop on Cloud Computing with AWS exclusively for 6th semester CSE students on 15th April 2025 in Aryabhata Seminar Hall.",
  "Under the Opticode Coding Club, CSE department organized a Competitive Coding Sprint (focused on C programming) for all CSE and aligned branch students on March 7th, 2025.",
  "Bootcamp on Generative AI at SSM Cultural Centre on 20th February 2025.",
  "One-week Faculty Development Program on 'Generative AI and DevOps' from 17th to 22nd February 2025, organized by Electronics & ICT Academy, IIT Guwahati.",
  "The Training & Placement Cell organized a Placement Training Program for pre-final year students (2026 Batch) in collaboration with 'Talent Battle' from 10th to 25th February 2025.",
  "AICTE ATAL Sponsored one week Faculty Development Program on AGILE SOFTWARE EVOLUTION AND MICROSERVICES MASTERY, organized by Department of CSE from 16th to 21st October 2023.",
  "FDP on Microsoft Azure AI in association with ICT Academy from 28/08/2023 to 01/09/2023.",
  "Collaborative Workshop on Cyber Security and Ethical Hacking, in partnership with Namana Inc USA and CyberSapiens, for 5th-semester CSE students.",
  "Marshmallow Challenge organized by Prof. Madhu Hiremath for 5th sem Students on 19/11/2024.",
  "Introduction to Google Developer Student Club event organized by Department of CSE in collaboration with Binary Blooms Coding Club on February 16, 2024.",
  "Two-Days Workshop on Mastering the Fundamentals of ReactJS on October 4th, 2024 at 2:00 PM, Placement Seminar Hall, BIET, Davangere.",
  "Ciao 2024 — Date: 14th May 2024, Time: 11:00 AM onwards, Venue: SSM Cultural Centre, BIET Campus.",
  "Department of Computer Science and Engineering celebrated 'International Women's Day' on 12/03/2023.",
  "Invited talk on Cyber Security: Foundation and Research Opportunities under UniCS for 5th and 3rd semester students, held on 07/01/2023 in association with IQAC cell.",
  "One day workshop on Cracking product based company interviews by Mr. Channa Bankapur for 5th semester CSE/ISE Students on 29/12/2022.",
  "C Quest competition under UniCS for all semester students held on 16/12/2022.",
  "BPL Inauguration held on 14/11/2022.",
  "FDP on Microsoft Power BI Data Analyst Associate organized in association with ICT Academy from 10/10/2022 to 14/10/2022.",
  "FRISSON-2022, Department technical fest including technical and cultural activities for inter-institute students organized on 10th and 11th June 2022.",
  "CODE-O-FIESTA — Coding related events for first year students held on 23/02/2022.",
  "TCS TechBytes IT quiz competition hosted by Dept. of CS&E, BIET, organized on 19/02/2022.",
  "Inauguration and MOU exchange with Skyscend in association with IQAC organized on 03/12/2021.",
  "Talk on Research Outcomes through Indexed Publications by Dr. Jalesh Kumar organized on 18/11/2021.",
  "C-Quest Coding Contest organized on 30/10/2021.",
  "Internal Hackathon for Manthan-2021 organized on 25/10/2021.",
  "Inauguration of Center of Excellence for Women Empowerment under the CSR initiative of Honeywell implemented by ICT Academy, organized on 23/10/2021.",
  "IBM Call for Code workshop organized on 07/06/2021.",
  "GitHub Campus program Re-Engineer the code culture — Orientation session on 25/05/2021.",
  "Virtual Webinar on Introduction to RPA in association with ISTE and UiPath Robotic Process Automation held on 24/05/2021.",
  "Cisco Netacad Centre and Student training Program on Programming Essential in Python for second year students on 25/01/2021.",
  "Coding Contest open for all streams conducted with written and coding round on HackerRank Platform organized on 14/12/2020.",
  "IT quiz competition — TCS TechBytes, preliminary round at Institute level on 25/02/2020.",
  "Smart India Hackathon 2020 — nationwide initiative to provide students a platform to solve pressing problems, organized on 07/02/2020.",
  "InfyTQ App Certified Training Programme according to current Industry Standards organized on 30/09/2019.",
]

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Forum Events
  let feInserted = 0, feSkipped = 0
  for (const ev of FORUM_EVENTS) {
    const exists = await ForumEvent.findOne({ tenant_id: TENANT_ID, deptId: DEPT_ID, title: ev.title })
    if (exists) { feSkipped++; continue }
    await ForumEvent.create({
      forum_event_id: ulid(),
      tenant_id:      TENANT_ID,
      deptId:         DEPT_ID,
      created_by:     CREATED_BY,
      title:          ev.title,
      description:    ev.description || '',
      attachmentUrl:  '',
    })
    feInserted++
  }
  console.log(`Forum Events  — inserted: ${feInserted}, skipped: ${feSkipped}`)

  // Department Activities
  let daInserted = 0, daSkipped = 0
  for (const text of DEPT_ACTIVITIES) {
    const exists = await DepartmentActivity.findOne({ tenant_id: TENANT_ID, deptId: DEPT_ID, text })
    if (exists) { daSkipped++; continue }
    await DepartmentActivity.create({
      dept_activity_log_id: ulid(),
      tenant_id:            TENANT_ID,
      deptId:               DEPT_ID,
      created_by:           CREATED_BY,
      text,
    })
    daInserted++
  }
  console.log(`Dept Activities — inserted: ${daInserted}, skipped: ${daSkipped}`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
