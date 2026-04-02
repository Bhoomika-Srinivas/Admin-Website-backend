'use strict'

/**
 * One-time seed script: inserts PhdScholar records for DEP001 / biet-college.
 * Usage: node scripts/seed-phd-scholars.js
 * Requires MONGODB_URI in .env
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { ulid }  = require('../src/layers/common/node_modules/ulid')

// ── Model (inline to avoid layer path issues) ────────────────────────────────
const PhdScholarSchema = new mongoose.Schema({
  phd_scholar_id:       { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  guideFacultyId:       { type: String, required: true, index: true },
  scholarName:          { type: String, required: true },
  institution:          { type: String },
  department:           { type: String },
  yearOfRegistration:   { type: Number },
  thesisTitle:          { type: String },
  yearOfDegreeAwarded:  { type: Number },
  courseWorkCompleted:  { type: Boolean, default: false },
  prePhdViva:           { type: Boolean, default: false },
  finalThesisSubmitted: { type: Boolean, default: false },
  status:               { type: String, enum: ['guided', 'guiding'], default: 'guiding' },
}, { timestamps: true })

const PhdScholar = mongoose.model('PhdScholar', PhdScholarSchema)

// ── Constants ────────────────────────────────────────────────────────────────
const TENANT_ID  = 'biet-college'
const DEPT_ID    = 'DEP001'
const CREATED_BY = 'seed-script'

// ── Guide name → facultyId map ───────────────────────────────────────────────
const GUIDES = {
  'Dr. Nirmala C R':      '01KMJ851ZCRMZRSVS6DCPFX6AD',
  'Dr. Chetana Prakash':  '01KMPXJG97Y902ZJBS6H13QK3S',
  'Dr. Pradeep N':        '01KMPXM9KJJJ001JNZF3VGTN8E',
  'Dr. Gururaj T':        '01KMPXPVQ21G13ET2E09G4NHGZ',
  'Dr. Naseer R':         '01KMPX4J3PGJ6GJ1CKKHBZT23Y',
  'Dr. Abdul Razak M S':  '01KMPX112876FZ078EB5MYVC1R',
  'Dr. Santosh K C':      '01KMPWYWP56MVRGD21E6EZJCFG',
  'Dr. Naresh Patel K M': '01KMPY2RR5B2X3SAQWKBKQCPKF',
  'Dr. Usha G R':         '01KMPYEGXN5Y9PP56XNW1PGT13',
  'Dr. Anusha R':         '01KMPY61MDF1ZZP9ZT0DAF6ZC7',
}

// ── Scholar data ─────────────────────────────────────────────────────────────
// status: 'guided' = degree awarded, 'guiding' = ongoing
const SCHOLARS = [

  // ── Dr. Nirmala C R — Guided ─────────────────────────────────────────────
  { guide: 'Dr. Nirmala C R', scholarName: 'Anoop Kumar B',    department: 'CS&E', institution: 'Symbiosis Institute of Technology, Pune', yearOfRegistration: 2013, thesisTitle: 'Design and Implementation of Energy Efficient Routing Protocol for Wireless Sensor Networks Based on Soft Computing Techniques',                    yearOfDegreeAwarded: 2018, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Roopa G M',        department: 'CS&E', institution: 'BIET',                                    yearOfRegistration: 2013, thesisTitle: 'A Hybrid approach for Efficient e-Advertising using Intelligent Concurrent Mobile Agents',                                                             yearOfDegreeAwarded: 2018, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Sankhya Nayak',    department: 'CS&E', institution: 'JNNCE',                                   yearOfRegistration: 2015, thesisTitle: 'Test localization and Extraction from Natural Scene Images',                                                                                             yearOfDegreeAwarded: 2019, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Srinivas B R',     department: 'CS&E', institution: 'JIT',                                     yearOfRegistration: 2015, thesisTitle: 'Big Data Analysis for Personalization in e-Commerce using Data Mining Techniques',                                                                      yearOfDegreeAwarded: 2021, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Naveen Kumar K R', department: 'CS&E', institution: 'BIET',                                    yearOfRegistration: 2016, thesisTitle: 'Optimized Data Mining Techniques for Zone Delineation and Yield Prediction for Precision Agriculture',                                                  yearOfDegreeAwarded: 2022, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Arun Kumar G H',   department: 'CS&E', institution: 'BIET',                                    yearOfRegistration: 2016, thesisTitle: 'Optimized Data Mining and Machine learning Techniques for Spatial Outlier Detection and Removal in Precision Agriculture',                             yearOfDegreeAwarded: 2022, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },
  { guide: 'Dr. Nirmala C R', scholarName: 'Abdul Razak M S',  department: 'CS&E', institution: 'BIET',                                    yearOfRegistration: 2015, thesisTitle: 'Predictive Analytics for Continuous Data Using Machine Learning Techniques',                                                                            yearOfDegreeAwarded: 2023, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },

  // ── Dr. Nirmala C R — Guiding ────────────────────────────────────────────
  { guide: 'Dr. Nirmala C R', scholarName: 'Anu C S',          department: 'CS&E', institution: 'BIET', yearOfRegistration: 2020, thesisTitle: 'Soil Monitoring and Crop Yield prediction using Computer Vision and Machine Learning for Precision Agriculture',                                   yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guiding' },
  { guide: 'Dr. Nirmala C R', scholarName: 'Radhika Patil',    department: 'CS&E', institution: 'BIET', yearOfRegistration: 2020, thesisTitle: 'An optimized Machine Learning approach for Predictive',                                                                                          yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guiding' },
  { guide: 'Dr. Nirmala C R', scholarName: 'Shilpa K C',       department: 'CS&E', institution: 'BIET', yearOfRegistration: 2020, thesisTitle: 'Intelligent Framework for Identification and Estimation of Nutrient Deficiency in Crops using Machine Learning and Computer Vision',              yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Nirmala C R', scholarName: 'Nomitha Chawla',   department: 'CS&E', institution: 'BIET', yearOfRegistration: 2020, thesisTitle: 'Extraction and Recognition of Characters from Brahmi Script using Few shot learning and Generative AI',                                          yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Chetana Prakash — Guided ─────────────────────────────────────────
  { guide: 'Dr. Chetana Prakash', scholarName: 'Aziz Khan Pathan', department: 'CS&E', institution: 'JIT',            yearOfRegistration: 2017, thesisTitle: 'An Efficient Approach for Frequent Item set Mining from Unstructured Data',                                                              yearOfDegreeAwarded: 2023, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Saurav Verma',     department: 'CS&E', institution: 'NMIMS, Mumbai',  yearOfRegistration: 2017, thesisTitle: 'An Improved Attack Detection and User Authentication Framework for Security in IoT Technology',                                         yearOfDegreeAwarded: 2023, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Kavitha G',        department: 'CS&E', institution: 'UBDT',           yearOfRegistration: 2015, thesisTitle: 'Noise Reduction Using Hybrid Filtering Techniques for UltraSound Images',                                                              yearOfDegreeAwarded: 2024, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Reshma S',         department: 'IS&E', institution: 'GAT, Bengaluru', yearOfRegistration: 2016, thesisTitle: 'An Efficient Infotainment System Design Module for Vanet by Integrating Cloud Computing',                                               yearOfDegreeAwarded: 2024, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Jyothi G C',       department: 'CS&E', institution: 'BIET',           yearOfRegistration: 2017, thesisTitle: 'Quantification and Assessment of Dental Caries and Alveolar Bone for Diagnosis and Treatment Using Image processing Techniques',        yearOfDegreeAwarded: 2024, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Shashirekha',      department: 'CS&E', institution: 'VTU, Mysore',    yearOfRegistration: 2017, thesisTitle: 'Design and Development of Bigdata Analytics Framework for E-Health care using Machine Learning',                                         yearOfDegreeAwarded: 2025, courseWorkCompleted: true, prePhdViva: true, finalThesisSubmitted: true, status: 'guided' },

  // ── Dr. Chetana Prakash — Guiding ────────────────────────────────────────
  { guide: 'Dr. Chetana Prakash', scholarName: 'Shwetha G',          department: 'CS&E', institution: 'BIET', yearOfRegistration: 2023, thesisTitle: 'Detection of Cyber bulling on Social Media Networks',                                                                                            yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Navya K G',          department: 'CS&E', institution: 'BIET', yearOfRegistration: 2023, thesisTitle: 'Framework of multi model data integration for brain tumor segmentation and classification using Deep Learning',                                  yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Chetana Prakash', scholarName: 'Madhuri Deekshit S', department: 'CS&E', institution: 'BIET', yearOfRegistration: 2023, thesisTitle: 'AI enhanced multi model imaging Technique for early and accurate Detection of Diabetic Retinopathy',                                            yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Pradeep N — Guided ───────────────────────────────────────────────
  { guide: 'Dr. Pradeep N', scholarName: 'Santosh K C',       department: 'CS&E', institution: 'BIET', yearOfRegistration: 2016, thesisTitle: 'Machine Learning Approach for Age Estimation and Sex Identification based on Digital Images of Teeth, Wrist and Femur bone.',                          yearOfDegreeAwarded: 2023, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guided'  },

  // ── Dr. Pradeep N — Guiding ──────────────────────────────────────────────
  { guide: 'Dr. Pradeep N', scholarName: 'Naveen S Pagad',    department: 'CS&E', institution: 'BIET', yearOfRegistration: 2017, thesisTitle: 'Knowledge Discovery in Clinical Data Using Natural Language Processing and Machine Learning Techniques in Cloud Environment',                           yearOfDegreeAwarded: 2025, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: true,  status: 'guiding' },
  { guide: 'Dr. Pradeep N', scholarName: 'Sheik Imran',       department: 'CS&E', institution: 'BIET', yearOfRegistration: 2021, thesisTitle: 'Ensemble Machine Learning and Deep Learning Approaches for Analysis and Classification of Different Tumors',                                           yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Pradeep N', scholarName: 'Hemashree H C',     department: 'CS&E', institution: 'BIET', yearOfRegistration: 2021, thesisTitle: 'Ensemble Learning and Deep Learning Approaches for Analysis and Classification of Oral Lesions',                                                      yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: true,  finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Pradeep N', scholarName: 'Chandrashekar M V', department: 'CS&E', institution: 'BIET', yearOfRegistration: 2023, thesisTitle: 'Analysis and Classification of Sleep disorders using Ensemble Machine Learning and Explainable AI (XAI) Models',                                     yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Gururaj T — Guiding ──────────────────────────────────────────────
  { guide: 'Dr. Gururaj T', scholarName: 'Arjun H',           department: 'CS&E',                    institution: 'BIET',                               yearOfRegistration: 2023, thesisTitle: 'Advance AI Algorithms for Analysis and Classification of Non-Tumurous Facial Pigmentation Disorders',                                         yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Gururaj T', scholarName: 'Anusha T',          department: 'Computer Science and Application', institution: 'SRS First Grade College, Chitradurga', yearOfRegistration: 2024, thesisTitle: 'Biological Sequences Exploration and Knowledge discovery in BioInformatics for Hereditary traits',                              yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Gururaj T', scholarName: 'Archana T Chawhan', department: 'CS&E',                    institution: 'BIET',                               yearOfRegistration: 2023, thesisTitle: 'Enhancing Authentication Based Attack Detection By Integrating Explainable Deep Learning In Cybersecurity',                                  yearOfDegreeAwarded: null, courseWorkCompleted: true,  prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Gururaj T', scholarName: 'Sony V Hovale',     department: 'CSE (Data Science)',      institution: 'BIET',                               yearOfRegistration: 2025, thesisTitle: 'Interpretable Deep Learning Techniques for Analysis and Identification of Melanoma Stages',                                                  yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Gururaj T', scholarName: 'Aishwarya T',       department: 'AIML',                    institution: 'BIET',                               yearOfRegistration: 2025, thesisTitle: 'AI driven Intelligent Underwater Image Enhancement and Object recognition framework for Defense Application',                                yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Naseer R — Guiding ───────────────────────────────────────────────
  { guide: 'Dr. Naseer R', scholarName: 'Mohamed Muthahir R', department: 'CS&E', institution: 'BIET', yearOfRegistration: 2023, thesisTitle: 'AI-Based Precision Agriculture for Crop Disease Detection and Pesticide Recommendation using Cloud Services',                                          yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Naseer R', scholarName: 'Vinayak P',          department: 'CS&E', institution: 'BIET', yearOfRegistration: 2025, thesisTitle: 'Framework for Cloud Data Security using Agentic AI',                                                                                                 yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Abdul Razak M S — Guiding ───────────────────────────────────────
  { guide: 'Dr. Abdul Razak M S', scholarName: 'Sana Ara',    department: 'AIML', institution: 'AIT, Chikkamagalur', yearOfRegistration: 2025, thesisTitle: 'Explainable AI for concept Drift: A transfer Learning approach in Deep Neural Networks',                                                yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Abdul Razak M S', scholarName: 'Parveen Taj', department: 'ISE',  institution: 'BIET',               yearOfRegistration: 2025, thesisTitle: 'Adaptive and Explainable Transfer Learning for Concept Drift: Resilient Deep Learning Models',                                          yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Santosh K C — Guiding ────────────────────────────────────────────
  { guide: 'Dr. Santosh K C', scholarName: 'Shankar Sarji',     department: 'CS&E',     institution: "KLE's JT College", yearOfRegistration: 2025, thesisTitle: 'Explainable Deep Learning Models for Classification and Abnormality detection of Macular Disease using OCT Images',                yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Santosh K C', scholarName: 'Usha C',            department: 'CSE (DS)', institution: 'BIET',             yearOfRegistration: 2025, thesisTitle: 'Osteoporosis Analysis and Classification in the Hip and Femur Bone using Interpretable Deep Learning Techniques',                   yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Santosh K C', scholarName: 'Chandrashekar K',   department: 'CSE',      institution: "KLE's JT College", yearOfRegistration: 2025, thesisTitle: 'Hybrid Machine Learning based Spatial Spectral Fusion for Hyperspectral Image Object Recognition',                                  yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Santosh K C', scholarName: 'Prema Yallur',      department: 'CSE',      institution: 'TCE, Gadag',       yearOfRegistration: 2025, thesisTitle: 'Semantic Based Multi Domain Sentimental Analysis',                                                                                  yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Usha G R — Guiding ──────────────────────────────────────────────
  { guide: 'Dr. Usha G R', scholarName: 'Sushma K H',  department: 'ECE', institution: 'Shri Dharmasthala Manjunatheshwara Institute of Technology, Ujire', yearOfRegistration: 2025, thesisTitle: 'Evaluating effectiveness of IDS solution in Responding to Emerging threats within IoT networks',                                              yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Usha G R', scholarName: 'Deeksha K R', department: 'ISE', institution: 'Yenepoya Institute of Technology, Moodbidri',                        yearOfRegistration: 2025, thesisTitle: 'Metaheuristic-Optimized AI Models for salinity Dynamics and Phenotyping of Stress-Tolerant Rice Varieties in coastal Regions',           yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Naresh Patel K M — Guiding ──────────────────────────────────────
  { guide: 'Dr. Naresh Patel K M', scholarName: 'Pavan Kumar E',      department: 'CSE', institution: 'UBDTCE',                                                                     yearOfRegistration: 2025, thesisTitle: 'A Multiagent and Hybrid Machine Learning Framework for cognitive assesment',                    yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
  { guide: 'Dr. Naresh Patel K M', scholarName: 'Shambulingappa H S', department: 'ISE', institution: 'Smt. Kamala and Sri Venkappa M Agadi College of Engineering and Technology', yearOfRegistration: 2025, thesisTitle: 'Artificial Intelligence Assisted Cryptographic Techniques for Network Security', yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },

  // ── Dr. Anusha R — Guiding ──────────────────────────────────────────────
  { guide: 'Dr. Anusha R', scholarName: 'Ranjitha H S', department: 'CSE', institution: 'BIET', yearOfRegistration: 2026, thesisTitle: 'A Vision Based Deep Learning System for diagnosis of infectious diseases in agricultural plants',                                                             yearOfDegreeAwarded: null, courseWorkCompleted: false, prePhdViva: false, finalThesisSubmitted: false, status: 'guiding' },
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

  for (const row of SCHOLARS) {
    const guideFacultyId = GUIDES[row.guide]
    if (!guideFacultyId) {
      console.warn(`SKIP: "${row.scholarName}" (guide: ${row.guide}) — guide ID not found`)
      skipped++
      continue
    }

    // Skip if already exists (same scholar name + guide + dept + tenant)
    const exists = await PhdScholar.findOne({
      tenant_id:      TENANT_ID,
      deptId:         DEPT_ID,
      guideFacultyId,
      scholarName:    row.scholarName
    })
    if (exists) {
      console.log(`SKIP: "${row.scholarName}" (guide: ${row.guide}) — already exists`)
      skipped++
      continue
    }

    await PhdScholar.create({
      phd_scholar_id:       ulid(),
      tenant_id:            TENANT_ID,
      created_by:           CREATED_BY,
      deptId:               DEPT_ID,
      guideFacultyId,
      scholarName:          row.scholarName,
      institution:          row.institution,
      department:           row.department,
      yearOfRegistration:   row.yearOfRegistration   ?? undefined,
      thesisTitle:          row.thesisTitle,
      yearOfDegreeAwarded:  row.yearOfDegreeAwarded  ?? undefined,
      courseWorkCompleted:  row.courseWorkCompleted,
      prePhdViva:           row.prePhdViva,
      finalThesisSubmitted: row.finalThesisSubmitted,
      status:               row.status,
    })

    console.log(`INSERT: "${row.scholarName}" (guide: ${row.guide})`)
    inserted++
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
