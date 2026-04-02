'use strict'

/**
 * One-time seed script: inserts FacultyResearchSummary records for DEP001 / biet-college.
 * Usage: node scripts/seed-research.js
 * Requires MONGODB_URI in .env
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { ulid }  = require('../src/layers/common/node_modules/ulid')

// ── Model (inline to avoid layer path issues) ────────────────────────────────
const FacultyResearchSummarySchema = new mongoose.Schema({
  faculty_research_summary_id: { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  facultyId:            { type: String, required: true },
  researchArea:         { type: String },
  guideName:            { type: String },
  guideDesignation:     { type: String },
  guideInstitution:     { type: String },
  guideType:            { type: String },
  thesisTitle:          { type: String },
  university:           { type: String },
  yearOfRegistration:   { type: Number },
  yearOfDegreeAwarded:  { type: Number },
  courseWorkCompleted:  { type: Boolean, default: false },
  prePhDVivaVoce:       { type: Boolean, default: false },
  finalThesisSubmitted: { type: Boolean, default: false },
  researchStatus:       { type: String },
  thesisDocumentUrl:    { type: String },
  remarks:              { type: String },
}, { timestamps: true })

const FacultyResearchSummary = mongoose.model('FacultyResearchSummary', FacultyResearchSummarySchema)

// ── Constants ────────────────────────────────────────────────────────────────
const TENANT_ID  = 'biet-college'
const DEPT_ID    = 'DEP001'
const CREATED_BY = 'seed-script'

// ── Faculty name → facultyId map ─────────────────────────────────────────────
const FACULTY = {
  'Dr. Nirmala C R':       '01KMJ851ZCRMZRSVS6DCPFX6AD',
  'Dr. Chetana Prakash':   '01KMPXJG97Y902ZJBS6H13QK3S',
  'Dr. Pradeep N':         '01KMPXM9KJJJ001JNZF3VGTN8E',
  'Dr. Gururaj T':         '01KMPXPVQ21G13ET2E09G4NHGZ',
  'Dr. Abdul Razak M S':   '01KMPX112876FZ078EB5MYVC1R',
  'Dr. Santosh K C':       '01KMPWYWP56MVRGD21E6EZJCFG',
  'Dr. Naseer R':          '01KMPX4J3PGJ6GJ1CKKHBZT23Y',
  'Dr. Naresh Patel K M':  '01KMPY2RR5B2X3SAQWKBKQCPKF',
  'Dr. Naveen H M':        '01KMPY89V3DXNYDN4KMSJMY4JF',
  'Dr. Gangadharappa S':   '01KMPX683TQRWSJAG8A2EMJJ66',
  'Mr. Jagadeesh A N':     '01KMPYM0CRJT8PN08BRF75T1SW',
  'Mrs. Radhika Patil':    '01KMPYHEG195T3TK193ZZ7NPAB',
  'Ms. Anu C S':           '01KMPYR4KZDPKV4K293WER6HZA',
  'Mrs. Gangamma G H':     '01KMPYX1R4JWYRHRCA6WXVPHD5',
  'Mr. Vishwanath V K':    '01KMQ0XVZ3QFHSZE535SFTDB7J',
  'Mr. Waseem Khan':       '01KMPYTBV0MT5BTMHXZJV23GGZ',
  'Mr. Chandrashekar M V': '01KMPZSJS0VEH5B5556YGB2T36',
  'Mrs. Preethi B':        '01KMPYZPR23YTCCVE46BHYZ9GH',
  'Mr. Arjun H':           '01KMQ1CADXK0HQF2XFR92F2M1Z',
  'Ms. Rachana G Sunkad':  '01KMQ178B0M5Y4825CCJ5EFXYY',
  'Mrs. Anusha N':         '01KMQ1EQ83TZYDX1JZNYJ006BS',
  'Mrs. Nomitha Chawla':   '01KMQ1NJTB4NJVJ3NH7ER9RFHM',
  'Mrs. Archana T Chawhan':'01KMQ1H40BNHTNV46JM250K5XJ',
  'Mr. Mohamed Muthahir R':'01KMQ1R9EWY85BMPGDE6JVRA5Q',
  'Mr. Vinayak P':         '01KMQ1YSP1PRSBR8FSAZESWTV0',
  'Mrs. Ranjitha H S':     '01KMQ1KSP8YYDECE389PNGJA6T',
}

// ── Research data ─────────────────────────────────────────────────────────────
const RECORDS = [
  {
    faculty: 'Dr. Nirmala C R',
    guideName: 'Dr. Ramaswamy V', guideDesignation: 'Principal', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Application of Multi Mobile Agent in e-commerce.',
    university: 'VTU', yearOfDegreeAwarded: 2013, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Chetana Prakash',
    guideName: 'Dr. Suryakanth V G', guideDesignation: 'Associate Professor', guideInstitution: 'Speech & Vision Lab, IIIT Hyderabad', guideType: 'external',
    thesisTitle: 'Bessel Features for Speech Signal Processing',
    university: 'IIIT Hyderabad', yearOfDegreeAwarded: 2013, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Pradeep N',
    guideName: 'Dr. K Karibasappa', guideDesignation: 'Vice Principal', guideInstitution: 'Dayanand Sagar College of Engineering, Bengaluru', guideType: 'external',
    thesisTitle: 'Analysis and Classification of Breast Tumors using Support Vector Machines',
    university: 'VTU', yearOfDegreeAwarded: 2014, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Gururaj T',
    guideName: 'Dr. Siddesh G M', guideDesignation: 'Professor', guideInstitution: 'MSRIT, Bengaluru', guideType: 'external',
    thesisTitle: 'Design And Development Of Smart Analytical Techniques For Biological Sequences.',
    university: 'VTU', yearOfDegreeAwarded: 2021, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Abdul Razak M S',
    guideName: 'Dr. Nirmala C R', guideDesignation: 'Professor and Head', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Predictive Analytics for Continuous Data Using Machine Learning Techniques',
    university: 'VTU', yearOfDegreeAwarded: 2023, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Santosh K C',
    guideName: 'Dr. Pradeep N', guideDesignation: 'Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Machine Learning Approach for Age Estimation and Sex Identification based on Digital Images of Teeth, Wrist and Femur bone.',
    university: 'VTU', yearOfDegreeAwarded: 2023, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Naseer R',
    guideName: 'Dr. Mohamed Raf', guideDesignation: 'Professor', guideInstitution: 'CS&E, UBDTCE, Davanagere', guideType: 'external',
    thesisTitle: 'Fusion of video based Gait and cumulative Foot pressure images for human identification in video surveillance system.',
    university: 'VTU', yearOfDegreeAwarded: 2023, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Naresh Patel K M',
    guideName: 'Dr. Ashok K', guideDesignation: 'Associate Professor', guideInstitution: 'ISE, BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Fuzzy Based Privacy Preserving Technique for Unstructured Healthcare Data',
    university: 'VTU', yearOfDegreeAwarded: 2023, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Naveen H M',
    guideName: 'Dr. Naveena C', guideDesignation: 'Associate Professor', guideInstitution: 'CSE, SJBIT, Bengaluru', guideType: 'external',
    thesisTitle: 'Analysis of Lung Cancer using Machine Learning Methods',
    university: 'VTU', yearOfDegreeAwarded: 2024, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Dr. Gangadharappa S',
    guideName: 'Dr. Naveena C', guideDesignation: 'Associate Professor', guideInstitution: 'CSE, SJBIT, Bengaluru', guideType: 'external',
    thesisTitle: 'Development of Pattern Recognition System for Analysis and Grading of Brain Tumor',
    university: 'VTU', yearOfDegreeAwarded: 2024, yearOfRegistration: null,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Awarded',
  },
  {
    faculty: 'Mr. Jagadeesh A N',
    guideName: 'Dr. Ravikumar B', guideDesignation: 'Professor', guideInstitution: 'Dept. of PG and CS, Kuvempu University, Shivamogga', guideType: 'external',
    thesisTitle: 'Rheumatic Heart Disease',
    university: 'Kuvempu University', yearOfDegreeAwarded: null, yearOfRegistration: 2022,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Radhika Patil',
    guideName: 'Dr. Nirmala C R', guideDesignation: 'Professor and Head', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'An optimized Machine Learning approach for Predictive',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2021,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Ms. Anu C S',
    guideName: 'Dr. Nirmala C R', guideDesignation: 'Professor and Head', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Soil Monitoring and Crop Yield prediction using Computer Vision and Machine Learning for Precision Agriculture',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2021,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Gangamma G H',
    guideName: 'Dr. Ashok K', guideDesignation: 'Associate Professor', guideInstitution: 'ISE, BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'An Approach for Detection of Land Degradation using Desertification Vulnerability Index and Machine Learning Algorithms',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2021,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Vishwanath V K',
    guideName: 'Dr. Gururaj H L', guideDesignation: 'Associate Professor', guideInstitution: 'Dept. of IT, MIT, Bengaluru', guideType: 'external',
    thesisTitle: 'Optimization of Energy Consumption in Collaborative Vehicular Edge Computing Networks',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2021,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Waseem Khan',
    guideName: 'Dr. Ashok K', guideDesignation: 'Associate Professor', guideInstitution: 'ISE, BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Framework for Cognitive Cyber Security Analysis using Ensemble Machine Learning',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Chandrashekar M V',
    guideName: 'Dr. Pradeep N', guideDesignation: 'Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Analysis and Classification of Sleep disorders using Ensemble Machine Learning and Explainable AI (XAI) Models',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Preethi B',
    guideName: 'Dr. Roopa G M', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Crop growth monitoring framework using remote sensing data and Machine learning techniques',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2021,
    courseWorkCompleted: true, prePhDVivaVoce: true, finalThesisSubmitted: true, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Arjun H',
    guideName: 'Dr. Gururaj T', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Advance AI Algorithms for Analysis and Classification of Non-Tumurous Facial Pigmentation Disorders',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Ms. Rachana G Sunkad',
    guideName: 'Dr. Naveen Kumar K R', guideDesignation: 'Associate Professor', guideInstitution: 'AIML, BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'AI Techniques for Analysis of Pathological Report to Identify Abnormalities',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Anusha N',
    guideName: 'Dr. Srinivas B R', guideDesignation: 'Associate Professor', guideInstitution: 'ISE, BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Detection and Classification of Neurological Disorders using Enhanced AI techniques',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: false, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Nomitha Chawla',
    guideName: 'Dr. Nirmala C R', guideDesignation: 'Professor and Head', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Extraction and Recognition of Characters from Brahmi Script using Few shot learning and Generative AI',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  // NOTE: Mrs. Shwetha G is in the research table but not found in the faculty list — skipped.
  {
    faculty: 'Mrs. Archana T Chawhan',
    guideName: 'Dr. Gururaj T', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Enhancing Authentication Based Attack Detection By Integrating Explainable Deep Learning In Cybersecurity',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: true, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Mohamed Muthahir R',
    guideName: 'Dr. Naseer R', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'AI-Based Precision Agriculture for Crop Disease Detection and Pesticide Recommendation using Cloud Services',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2023,
    courseWorkCompleted: false, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mr. Vinayak P',
    guideName: 'Dr. Naseer R', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'Agentic AI approach for cloud network security',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2025,
    courseWorkCompleted: false, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
  {
    faculty: 'Mrs. Ranjitha H S',
    guideName: 'Dr. Anusha R', guideDesignation: 'Associate Professor', guideInstitution: 'BIET, Davanagere', guideType: 'internal',
    thesisTitle: 'A Vision based deep learning for identification of infectious diseases in agriculture plants',
    university: 'VTU', yearOfDegreeAwarded: null, yearOfRegistration: 2026,
    courseWorkCompleted: false, prePhDVivaVoce: false, finalThesisSubmitted: false, researchStatus: 'Ongoing',
  },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('ERROR: MONGODB_URI not set in .env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  let inserted = 0
  let skipped  = 0

  for (const row of RECORDS) {
    const facultyId = FACULTY[row.faculty]
    if (!facultyId) {
      console.warn(`SKIP: "${row.faculty}" — not found in faculty map`)
      skipped++
      continue
    }

    // Skip if already exists for this faculty + dept
    const exists = await FacultyResearchSummary.findOne({ tenant_id: TENANT_ID, deptId: DEPT_ID, facultyId })
    if (exists) {
      console.log(`SKIP: "${row.faculty}" — record already exists`)
      skipped++
      continue
    }

    await FacultyResearchSummary.create({
      faculty_research_summary_id: ulid(),
      tenant_id:            TENANT_ID,
      created_by:           CREATED_BY,
      deptId:               DEPT_ID,
      facultyId,
      guideName:            row.guideName,
      guideDesignation:     row.guideDesignation,
      guideInstitution:     row.guideInstitution,
      guideType:            row.guideType,
      thesisTitle:          row.thesisTitle,
      university:           row.university,
      yearOfDegreeAwarded:  row.yearOfDegreeAwarded  ?? undefined,
      yearOfRegistration:   row.yearOfRegistration   ?? undefined,
      courseWorkCompleted:  row.courseWorkCompleted,
      prePhDVivaVoce:       row.prePhDVivaVoce,
      finalThesisSubmitted: row.finalThesisSubmitted,
      researchStatus:       row.researchStatus,
    })

    console.log(`INSERT: "${row.faculty}"`)
    inserted++
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
