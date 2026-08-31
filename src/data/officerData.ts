const CLOUD_NAME = 'lxjudwn8'
const ROOT_FOLDER = 'colonel-badasu/site'

export type ImageAsset = {
  src: string
  fallbackSrc: string
  thumbnailSrc: string
  placeholderSrc: string
  srcSet: string
  alt: string
  caption: string
  width: number
  height: number
}

export type TimelineItem = {
  period: string
  title: string
  location: string
  description: string
}

export type FeatureCard = {
  title: string
  description: string
  image: ImageAsset
  to: string
  category?: string
  meta?: string
}

export type AwardItem = {
  title: string
  year: string
  description: string
}

export type EducationItem = {
  category: string
  title: string
  institution: string
  period: string
  description: string
}

export type DetailItem = {
  label: string
  value: string
}

export type CategoryLink = {
  label: string
  to: string
}

export type WorkHistoryItem = {
  title: string
  location: string
  period: string
  description: string[]
}

export const brandAssets = {
  gafLogo: imageAsset('image.png', 'Ghana Armed Forces crest', 'Ghana Armed Forces crest')
}

export const officer = {
  rank: 'Colonel',
  name: 'Henry Kwaku Badasu',
  formalName: 'BADASU KWAKU HENRY',
  force: 'Ghana Armed Forces',
  motto: 'Professionalism, Integrity and Discipline',
  branch: 'Teshie, Accra - Ghana',
  academy: 'Ghana Military Academy',
  enlistment: '22 November 1995',
  profileLabel: 'Senior Army Officer',
  shortBio:
    'Col. Henry Kwaku Badasu is a senior Army officer of the Ghana Armed Forces with extensive experience in UN peacekeeping operations in Africa, risk, crisis, and security management.',
  biography: [
    'Col. Henry Kwaku Badasu is a senior Army officer of the Ghana Armed Forces with extensive experience in UN peacekeeping operations in Africa. He has demonstrated a solid understanding of risk, crisis, and security management, and is known for his strong people and leadership skills.',
    'Col. Henry Kwaku Badasu possesses advanced knowledge of the French language and is proficient in all Microsoft Suit or Office applications. He is a graduate of the University of Yaounde, Cameroon, where he earned a MA in Defense, Conflict, and Security. In addition, he completed the War College\'s Strategic Level Leadership and Management program, which has prepared him for the demanding responsibilities of senior military leadership.',
    'Throughout his career, Col. Henry Kwaku Badasu has distinguished himself as a dedicated and effective leader, with a keen understanding of the complexities of military operations. He has served in a variety of leadership positions, including in combat operations and logistics management. His commitment to the welfare of his subordinates and his unflinching dedication to the mission have earned him the respect and admiration of his peers, subordinates, and superiors alike.',
    'As a senior Army officer in the Ghana Armed Forces, Col. Henry Kwaku Badasu continues to serve his country with distinction and honour. His expertise in UN peacekeeping operations in Africa and his skills in risk, crisis, and security management has been invaluable to the Ghana Armed Forces. He is a consummate professional and leader who embodies the highest standards of military ethics and conduct.'
  ],
  spokenLanguages: ['Ewe', 'Twi', 'English', 'French'],
  writtenLanguages: ['Ewe', 'Twi', 'English', 'French'],
  frenchLevel: 'Advanced Level, B1, B2',
  hobbies: ['Reading', 'Singing', 'Badminton', 'Lawn Tennis']
}

export const biographicDetails: DetailItem[] = [
  { label: 'Name', value: 'BADASU KWAKU' },
  { label: 'First Name', value: 'HENRY' },
  { label: 'Rank', value: 'COLONEL' },
  { label: 'Nationality', value: 'GHANAIAN' },
  { label: 'Date of Birth', value: '30 JUNE 1972' },
  { label: 'Place of Birth', value: 'KPANDO' },
  { label: 'Son of', value: 'MR. ALEXANDER BADASU AND MADAME FELICIA BADASU (BOTH LATE)' },
  { label: 'Religion', value: 'CHRISTIAN/ROMAN CATHOLIC' },
  { label: 'Ethnic', value: 'EWE' },
  { label: 'Personal Address', value: 'ARMY HQ, BURMA CAMP' },
  { label: 'Marital Status', value: 'MARRIED' }
]

export const images: ImageAsset[] = [
  imageAsset('hero/a1.png', 'Colonel Badasu official portrait', 'Official portrait'),
  imageAsset('hero/a4.png', 'Colonel Badasu operational service image', 'Operational service'),
  imageAsset('hero/a5.png', 'Colonel Badasu professional engagement image', 'Professional engagement'),
  imageAsset('hero/graduation.jpeg', 'Colonel Badasu at University of London graduation ceremony', 'Academic Convocation & University of London Milestones'),
  imageAsset('hero/tv3.jpeg', 'Colonel Badasu during national television appearance', 'National Television Appearances & Media Features'),
  imageAsset('hero/ecowas.jpeg', 'Colonel Badasu at ECOWAS peace support mission', 'ECOWAS Peace Support Operations'),
  imageAsset('hero/boundary.jpeg', 'Colonel Badasu during border security and tactical operations', 'Border Security & Tactical Operations')
]

export const profileHomeImage = imageAsset('hero/profile-home.jpeg', 'Colonel Badasu University of London Graduation photo', 'Academic Convocation')

// Separate gallery images (a1–a23) — update as more images are added to gallery folder
export const galleryImages: ImageAsset[] = [
  imageAsset('gallery/a1.png', 'Colonel Badasu gallery portrait', 'Photo 1'),
  imageAsset('gallery/a2.png', 'Colonel Badasu gallery portrait', 'Photo 2'),
  imageAsset('gallery/a3.png', 'Colonel Badasu in professional service setting', 'Photo 3'),
  imageAsset('gallery/a4.png', 'Colonel Badasu operational service moment', 'Photo 4'),
  imageAsset('gallery/a5.png', 'Colonel Badasu professional engagement', 'Photo 5'),
  imageAsset('gallery/a6.png', 'Colonel Badasu training and education moment', 'Photo 6'),
  imageAsset('gallery/a7.png', 'Colonel Badasu gallery image', 'Photo 7'),
  imageAsset('gallery/a9.png', 'Colonel Badasu gallery image', 'Photo 9')
]

export const workHistory: WorkHistoryItem[] = [
  {
    title: 'Chief Operations Officer',
    location: 'ECOMIG Force Headquarters, Bakau, Gambia',
    period: '18 January 2018 - 28 March 2019',
    description: [
      'Responsible for planning and execution assessments on the process of force generation, rotation, and repatriation for Ghana Armed Forces Units deployed as part of Ghana Military Components to United Nations operations, as well as formulating the force\'s plans for the deployment to new missions on peace support operations.',
      'Issued redeployment or rotation plans for existing ones following ECOWAS commission directives, ensured proposed troop contribution from contribution member states met the operational requirements, and directed, monitored, controlled, and coordinated the activities of the operations plans section and the Allied Liaison Office of the ECOMIG Force.',
      'Carried out research development and review of the ECOWAS standby force doctrine, monitored reforms of ECOWAS standby force peacekeeping policies, methodology, and procedures, and initiated relevant and corresponding updates.',
      'Evaluated and assessed personnel deployment in peace support operations mission theatres and prepared and presented periodic briefings on peacekeeping threat assessment to higher command.'
    ]
  },
  {
    title: 'Mentor for ASIS International Certifications',
    location: 'Ghana',
    period: 'August 2016 - Present',
    description: [
      'Assisted interested new members to register and become members, guided registered members about how to prepare and approach the certification exams, and assisted members on how and where to gather learning materials for the certification exams.'
    ]
  },
  {
    title: 'Member of Institute of Human Resources Management Professionals',
    location: 'Ghana',
    period: 'May 2015 - Present',
    description: [
      'Provided necessary direction to prospective HR professionals to be certified, directed and guided the strategic drive for Ghana Army personnel administration in recruitment and training, and assisted wards of members to get enlisted into the Ghana Armed Forces where desired.'
    ]
  },
  {
    title: 'Deputy Director Army Peacekeeping Operations',
    location: 'Army Headquarters, Accra, Ghana',
    period: 'July 2015 - January 2018',
    description: [
      'Coordinated and managed the nomination, selection, and screening of troops before pre-deployment training for international peacekeeping operations.',
      'Coordinated the pre-deployment training of Ghanaian contingents for international peacekeeping operations, planned the rotation or replacement of Ghanaian contingents on international peacekeeping operations, received and compiled reports from Ghanaian contingents on international peacekeeping operations, and prepared them for the Chief of Army Staff.',
      'Coordinated the UN peacekeeping training in partnership with the United States African Contingency Operations Assistance (ACOTA) team in Ghana.'
    ]
  },
  {
    title: 'Deputy Director Army Administration',
    location: 'Army Headquarters, Accra, Ghana',
    period: '14 May 2013 - 16 July 2016',
    description: [
      'Led and supervised a team of staff officers and civilians at the headquarters, coordinated the operational, administrative, and training activities of units under command, ensured that reports and returns from units under command were received and submitted to Army Headquarters on time, and liaised with a headquarters staff of other security agencies and stakeholders within the command.'
    ]
  },
  {
    title: 'Military Assistant to Force Commander',
    location: 'Force Headquarters, United Nations Mission in South Sudan, Juba, South Sudan',
    period: 'April 2013 - May 2014',
    description: [
      'Established liaisons with UN agencies and local authorities, conducted performance evaluations for team members, chaired the Joint Operations Security Committee of the sector, and planned and conducted all forms of patrols.',
      'Collected analysed information and attended daily and weekly JOC (Joint Operation Centre) meetings.'
    ]
  },
  {
    title: 'Senior Military Liaison Officer',
    location: 'Force Headquarters, United Nations Mission in South Sudan, Equatorial State, Juba, South Sudan',
    period: 'April 2013 - May 2014',
    description: [
      'Drafted command policy guidelines to guide capabilities, limitations, and employment of the Commander\'s approval.',
      'Supervised the organization of combat units, resource allocations, and command and support relationships, ensuring effective and efficient resource allocation and employment synchronization of all organic and supporting assets and resources.',
      'Partnered with UN agencies, humanitarian agencies, international NGOs, UN police, and other forces to plan, execute, and evaluate the security needs of about 75,000 internally displaced persons (IDP) in UN Protection of Civilian (POC) sites and UN Mission Support Area (MSA).'
    ]
  },
  {
    title: 'Assistant Director of Peacekeeping Operations and Training',
    location: 'Ghana Army, Accra, Ghana',
    period: 'February 2014 - February 2015',
    description: [
      'Identified training and development needs through job analysis, appraisal schemes, and regular consultation with staff officers at the Army Head and Department of Personnel Administration.',
      'Designed and expanded training and development programs based on both the Army\'s training doctrine and the individual\'s needs. Developed effective induction programs, conducted appraisals, devised individual learning plans, and produced training materials for in-house courses.'
    ]
  },
  {
    title: 'Assistant Director Army Administration',
    location: 'Army Headquarters, Accra, Ghana',
    period: 'May 2010 - July 2014',
    description: [
      'Led and supervised a team of administrative staff officers and civilians at the Headquarters, coordinated the ceremonial, administrative, and training activities of units under command, and ensured that reports and returns from units under command were received at Army Headquarters on time.',
      'Liaised with the Headquarters staff of other security agencies and stakeholders within the commands and coordinated visits by foreign dignitaries to the Presidency of Ghana.'
    ]
  },
  {
    title: 'Company Commander',
    location: '5 Infantry Battalion, Ghana Army, Ghana',
    period: 'December 2008 - May 2010',
    description: [
      'Responsible for training, security, supervision of welfare, operations, and discipline of troops.',
      'Supervised the conduct of security assessments and made recommendations to the Commanding Officer. Wrote all operational instructions, quarterly and annual training reports, orders and plans, and updated them when required.'
    ]
  },
  {
    title: 'Company Leader',
    location: 'United Nations Mission in Democratic Republic of Congo, Democratic Republic of Congo',
    period: 'June 2007 - December 2008',
    description: [
      'Liaised with UN agencies and NGOs like WHO, ICRC, and local authorities to facilitate relief and aid convoys.',
      'Conducted physical security assessments, analysed security trends, and submitted reports to higher headquarters. Conducted humanitarian and civil-military cooperation and served as the focal point officer for quick impact projects (QIP) undertaken by the Ghana Battalion in the area of responsibility.'
    ]
  },
  {
    title: 'Training Officer',
    location: '5 Infantry Battalion, Ghana Army, Ghana',
    period: 'December 2007 - June 2008',
    description: [
      'Prepared training packages for police, military, and immigration personnel. Lectured in counter-insurgency, internal security, and counter-terrorism.',
      'Planned, prepared, and executed practical field exercises and conducted appraisals for students and the training team periodically.'
    ]
  },
  {
    title: 'Company Leader',
    location: 'United Nations Mission in Democratic Southern Lebanon, Democratic Republic of Lebanon',
    period: 'June 2006 - December 2008',
    description: [
      'Liaised with UN agencies and NGOs like WHO, ICRC, and local authorities to facilitate relief and aid convoys.',
      'Conducted physical security assessments, analysed security trends, and submitted reports to higher headquarters. Conducted humanitarian and civil-military cooperation and served as the focal point officer for quick impact projects (QIP) undertaken by the Ghana Battalion in the area of responsibility.'
    ]
  },
  {
    title: 'Company Leader',
    location: '5 Infantry Battalion, Ghana Army, Ghana',
    period: 'December 2004 - December 2007',
    description: [
      'Responsible for writing security instructions for all key installations and vulnerable points in the company\'s area of responsibility.',
      'Supervised the conduct of security assessments and made recommendations to the commanding officer. Wrote all operational instructions, quarterly and annual training reports, orders, and plans, and updated them when required.'
    ]
  },
  {
    title: 'Military Observer Team Leader',
    location: 'The United Nations Mission In La Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: [
      'Established liaisons with UN agencies, local security agencies, and local authorities and conducted performance evaluations for team members.',
      'Chaired the Joint Operations Security Committee of the sector, planned and conducted all forms of patrols, collected and analysed information, and attended daily and weekly Joint Operation Centre Meetings.'
    ]
  },
  {
    title: 'Chief Security Officer',
    location: 'ECOWAS mission in La Cote d\'Ivoire',
    period: 'January 2003 - June 2004',
    description: [
      'Conducted fire safety surveys and submitted reports to higher headquarters.',
      'Prepared an evacuation plan for troops in case of emergency and conducted security surveys and threat analyses, submitting reports to battalion headquarters. Investigated and prepared reports on minor cases of theft and illegal entry.'
    ]
  },
  {
    title: 'Platoon Leader',
    location: '5 Infantry Battalion of Ghana Army, Ghana',
    period: 'March 2002 - January 2003',
    description: [
      'Enforced a strict set of rules regarding the organization and management of the squad, ensured the maintenance of weapons and attire, the condition of the soldiers, the upkeep of equipment such as radios and vehicles, and the general organization of the platoon.',
      'Maintained an open line of communication between the soldiers beneath the troops\' higher command.'
    ]
  },
  {
    title: 'Platoon Leader',
    location: 'United Nations Mission in Sierra Leone, Sierra Leone',
    period: 'September 1998 - March 2002',
    description: [
      'Liaised with Disarmament Demobilization Reintegration (DDR) officials for the establishment of demobilized centres for disarmament programs.',
      'Coordinated the activities of aid and humanitarian agencies in the discharge of their duties in the area of responsibility. Planned and executed troops\' general administration, training, welfare, and discipline.'
    ]
  },
  {
    title: 'Platoon Leader',
    location: '5 Infantry Battalion of the Ghana Army, Ghana',
    period: 'August 1997 - September 1998',
    description: [
      'Enforced a strict set of rules regarding the organization and management of the squad, ensured the maintenance of weapons and attire, the condition of the soldiers, the upkeep of equipment such as radios and vehicles, and the general organization of the platoon.',
      'Reported to the Officer Commanding and directly transferred the orders that came down the chain of command.'
    ]
  }
]

export const careerHighlights: FeatureCard[] = [
  {
    title: 'Chief Operations Officer, ECOMIG Force Headquarters',
    description: 'Planning, force generation, rotation, repatriation, doctrine review, and peacekeeping threat assessment.',
    image: imageAsset('career/boundary.jpeg', 'Colonel Badasu border security operations image', 'Border security operations'),
    to: '/career',
    category: 'Command',
    meta: 'Career Record'
  },
  {
    title: 'Deputy Director Army Peacekeeping Operations',
    description: 'Nomination, screening, pre-deployment training, rotation planning, and peacekeeping reporting.',
    image: imageAsset('career/ecowas.jpeg', 'Colonel Badasu ECOWAS peacekeeping image', 'ECOWAS peacekeeping'),
    to: '/career',
    category: 'Operations',
    meta: 'Career Record'
  },
  {
    title: 'Deputy Director Army Administration',
    description: 'Headquarters administration, operational coordination, training activities, and stakeholder liaison.',
    image: imageAsset('career/a5.png', 'Colonel Badasu professional engagement image', 'Professional engagement image'),
    to: '/career',
    category: 'Staff',
    meta: 'Career Record'
  },
  {
    title: 'UN and ECOWAS Operational Service',
    description: 'Assignments across Sierra Leone, Liberia, Cote d\'Ivoire, DR Congo, Lebanon, South Sudan, and The Gambia.',
    image: imageAsset('career/a6.png', 'Colonel Badasu training and education image', 'Training and education image'),
    to: '/career',
    category: 'Service',
    meta: 'Career Record'
  }
]

export const achievements: FeatureCard[] = [
  {
    title: 'UN Peacekeeping Operations in Africa',
    description: 'Extensive operational experience in United Nations peacekeeping operations across Africa.',
    image: imageAsset('achievements/ecowas.jpeg', 'Colonel Badasu peacekeeping operations image', 'Peacekeeping operations'),
    to: '/career#operational-experience',
    category: 'Peacekeeping',
    meta: 'Institutional Service'
  },
  {
    title: 'Risk, Crisis, and Security Management',
    description: 'Demonstrated understanding of risk, crisis, and security management in military operational contexts.',
    image: imageAsset('achievements/a4.png', 'Colonel Badasu security management image', 'Security management image'),
    to: '/career#work-history',
    category: 'Security',
    meta: 'Institutional Service'
  },
  {
    title: 'Strategic Leadership Preparation',
    description: 'War College Strategic Level Leadership and Management preparation for senior military responsibilities.',
    image: imageAsset('achievements/jungle.jpeg', 'Colonel Badasu jungle operations image', 'Jungle operations'),
    to: '/education#professional-courses',
    category: 'Leadership',
    meta: 'Institutional Service'
  },
  {
    title: 'Professional Mentorship and Service',
    description: 'Mentorship for ASIS International Certifications and guidance for professional development.',
    image: imageAsset('achievements/boundary.jpeg', 'Colonel Badasu boundary operations image', 'Boundary operations'),
    to: '/career#work-history',
    category: 'Mentorship',
    meta: 'Institutional Service'
  }
]

export const timeline: TimelineItem[] = workHistory.map((item) => ({
  period: item.period,
  title: item.title,
  location: item.location,
  description: item.description[0]
}))

export const volunteerExperience: WorkHistoryItem[] = [
  {
    title: 'Volunteer Experience',
    location: 'Juba, South Sudan',
    period: 'February 2015',
    description: [
      'Coordinated the activities of security stakeholders to celebrate the International Day of the African Child.',
      'Participated in the planning and execution of a verification exercise aimed at relocating approximately 70,000 internally displaced persons (IDPs) to a new Protection of Civilians (POC) site.',
      'Through organizing sporting activities with soldiers, building friendships, winning hearts and minds, and enhancing community leadership of IDPs. Coordinated the activities of IDP community watch groups.'
    ]
  },
  {
    title: 'Volunteer Experience',
    location: 'Fikesedougou, Democratic Republic of La Cote d\'Ivoire',
    period: 'February 2013 - February 2014',
    description: [
      'Assisted in teaching the English Language in primary schools.',
      'Assisted community leaders in raising awareness about the effect of armed conflict and organized sporting activities to help communities come together to build trust and coexistence.'
    ]
  },
  {
    title: 'Volunteer Experience',
    location: 'Accra, Ghana',
    period: 'Period not stated',
    description: [
      'Assisted flood victims in constructing temporary accommodations and coached and mentored the youth in the community to unearth their potential.'
    ]
  }
]

export const professionalCertificates: EducationItem[] = [
  {
    category: 'Professional Development Certificate',
    title: 'Certificate',
    institution: 'Kuolikuro Peacekeeping Training Centre in Bamako, Mali',
    period: 'June 2004',
    description: 'Certificate from the Kuolikuro Peacekeeping Training Centre in Bamako, Mali.'
  },
  {
    category: 'Professional Development Certificate',
    title: 'Post-graduate certificate in Public Administration',
    institution: 'Ghana Institute of Management and Public Administration (GIMPA), Accra, Ghana',
    period: 'August 2007 - March 2008',
    description: 'Post-graduate certificate in Public Administration.'
  },
  {
    category: 'Professional Development Certificate',
    title: 'Professional Accountant (ACCA Global-UK) diploma',
    institution: 'Oxford Brookes University, United Kingdom',
    period: 'May 2005 - December 2008',
    description: 'A Professional Accountant (ACCA Global-UK) diploma.'
  },
  {
    category: 'Professional Development Certificate',
    title: 'Post-graduate diploma in Public Administration',
    institution: 'GIMPA, Accra, Ghana',
    period: 'September 2009 - August 2010',
    description: 'Post-graduate diploma in Public Administration.'
  },
  {
    category: 'Professional Development Certificate',
    title: 'Diplome d\'Etudes en Langue Francaise',
    institution: 'Accra, Ghana',
    period: 'December 2010',
    description: 'Diplome d\'Etudes en Langue Francaise.'
  },
  {
    category: 'Professional Development Certificate',
    title: 'Diploma in International Relations and Diplomacy (French)',
    institution: 'Integrated Mission Training Centre in Sebroko Abidjan, La Cote d\'Ivoire',
    period: 'August 2011',
    description: 'Diploma in International Relations and Diplomacy (French).'
  }
]

export const militaryDiplomas: EducationItem[] = [
  {
    category: 'Military Diploma',
    title: 'Diploma in Conflict and Crises Management',
    institution: 'Cranfield University, United Kingdom',
    period: '2010',
    description: 'Diploma in Conflict and Crises Management from Cranfield University in the United Kingdom.'
  },
  {
    category: 'Military Diploma',
    title: 'Diploma in Defence Management',
    institution: 'Cranfield University, United Kingdom',
    period: '2010',
    description: 'Diploma in Defence Management from Cranfield University in the United Kingdom.'
  },
  {
    category: 'Military Diploma',
    title: 'Diploma in Exclusive Economic Zone Management',
    institution: 'Wales University, UK',
    period: 'Period not stated',
    description: 'Diploma in Exclusive Economic Zone Management from Wales University, UK.'
  },
  {
    category: 'Military Certificate',
    title: 'Certificate in Integrated Peace Support Operation',
    institution: 'Kofi Annan International Peacekeeping Training Centre, Accra, Ghana',
    period: 'Period not stated',
    description: 'Certificate in Integrated Peace Support Operation.'
  },
  {
    category: 'Military Course',
    title: 'Integrated Combat Service Support - Logistics Estimates',
    institution: 'British Field Training Team in Accra, Ghana',
    period: 'Period not stated',
    description: 'Integrated Combat Service Support - Logistics Estimates course.'
  }
]

export const unitarPociCertificates: EducationItem[] = [
  {
    category: 'UNITAR-POCI Certificates',
    title: 'History of Peacekeeping, 1997-2006',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'History of Peacekeeping, 1988-1996',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Principles of Peace Support Operations',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Ethics in Peacekeeping',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Security Measures for United Nations Peacekeepers',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Operational Logistical Support',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Logistical Support to UN Peacekeeping Operations',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'The Conduct of Humanitarian Relief Operations',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Disarmament, Demobilization and Reintegration (DDR): Principles of Intervention and Management in Peacekeeping Operations',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Advanced Topics in UN Logistics',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  },
  {
    category: 'UNITAR-POCI Certificates',
    title: 'Commanding United Nations Peacekeeping Operations',
    institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire',
    period: 'June 2004 - July 2005',
    description: 'UNITAR-POCI certificate of completion obtained at UNOCI FHQ, Abidjan, Cote d\'Ivoire.'
  }
]

export const professionalCourses: EducationItem[] = [
  {
    category: 'Professional Course',
    title: 'Diploma in Military Studies in Strategic Defence and War Studies',
    institution: 'Accra',
    period: 'October 1995 - August 1997',
    description: 'Diploma in Military Studies in Strategic Defence and War Studies.'
  },
  {
    category: 'Professional Course',
    title: 'Military Parachuting Certificate',
    institution: 'Tamale, Ghana',
    period: 'August 1996 - October 1996',
    description: 'Military Parachuting Certificate.'
  },
  {
    category: 'Professional Course',
    title: 'Certificate in Basic Artillery for Basic Artillery Instructors Course',
    institution: 'Institution not stated',
    period: 'March 1998 - November 1998',
    description: 'Certificate in Basic Artillery for Basic Artillery Instructors Course.'
  },
  {
    category: 'Professional Course',
    title: 'Young Officers Course',
    institution: 'Ghana Army Combat Training School Teshie, Accra, Ghana',
    period: 'June 2000 - December 2000',
    description: 'Young Officers Course.'
  },
  {
    category: 'Professional Course',
    title: 'Military Law, Law of Armed and Unarmed Conflict, & International Humanitarian Law',
    institution: 'Institution not stated',
    period: 'July 2003 - November 2003',
    description: 'Military Law, Law of Armed and Unarmed Conflict, and International Humanitarian Law.'
  },
  {
    category: 'Professional Course',
    title: 'Combat Team Commanders Course',
    institution: 'Ghana Army Combat Training School Teshie, Accra, Ghana',
    period: 'June 2008 - December 2008',
    description: 'Combat Team Commanders Course.'
  },
  {
    category: 'Professional Course',
    title: 'Senior Division Course',
    institution: 'Ghana Armed Forces Command and Staff College Accra, Ghana',
    period: 'September 2009 - August 2010',
    description: 'Senior Division Course.'
  },
  {
    category: 'Professional Course',
    title: 'Junior Division Course',
    institution: 'Ghana Armed Forces Command and Staff College Accra, Ghana',
    period: 'July 2008 - January 2009',
    description: 'Junior Division Course.'
  },
  {
    category: 'Professional Course',
    title: 'Joint Campaign Planning (French)',
    institution: 'Kofi Annan International Peacekeeping Training Centre (KAIPTC), Teshie, Accra, Ghana',
    period: 'October 2010 - November 2010',
    description: 'Joint Campaign Planning (French).'
  },
  {
    category: 'Professional Course',
    title: 'War College',
    institution: 'Ecole Superieure Intenationale de Guerre Yaounde, Cameroon',
    period: 'Period not stated',
    description: 'War College.'
  },
  {
    category: 'Professional Course',
    title: 'MA in Strategy Defence and Security',
    institution: 'University of Yaounde (SOA II)',
    period: 'Period not stated',
    description: 'MA in Strategy Defence and Security.'
  },
  {
    category: 'Professional Course',
    title: 'Advanced Diploma in French',
    institution: 'Alliance Francaise, Accra',
    period: 'Period not stated',
    description: 'Advanced Diploma in French.'
  },
  {
    category: 'Professional Course',
    title: 'Intermediate Diploma in French',
    institution: 'Alliance Francaise',
    period: 'Period not stated',
    description: 'Intermediate Diploma in French.'
  },
  {
    category: 'Professional Course',
    title: 'Master in Mediation and Conflict Resolution',
    institution: 'Euclid University',
    period: 'Period not stated',
    description: 'Master in Mediation and Conflict Resolution.'
  },
  {
    category: 'Professional Course',
    title: 'Bachelor of Laws (LLB Hons)',
    institution: 'University of London',
    period: 'Period not stated',
    description: 'Bachelor of Laws (LLB Hons).'
  }
]

export const education: EducationItem[] = [
  ...professionalCertificates,
  ...militaryDiplomas,
  ...unitarPociCertificates,
  ...professionalCourses
]

export const recentAssignments = [
  'Adjutant Commandant of the Sous Groupement de Securite in Abidjan',
  'Chief of Protection for Authorities in the United Nations operations in Cote d\'Ivoire',
  'Assistant Director for Peacekeeping Operations at Army Headquarters in Accra',
  'Military Assistant to the United Nations Mission in South Sudan (UNMISS) FC at UNMISS FHQ in Juba',
  'Liaison Officer for UNMISS in Central Equatoria State, Juba, South Sudan',
  'Deputy Director of Administration at Army Headquarters in Accra',
  'Chief Operations Officer for the Economic Community of West African States (ECOWAS) mission in The Gambia',
  'Ghana Contingent Commander in The Gambia',
  'Deputy Director of Plans Research and Development at the General Headquarters of Ghana Armed Forces',
  'Director of Boundary Operations for the Ghana Boundary Commission',
  'Co-presided over the Ghana-Togo International Boundary Reaffirmation',
  'Co-presided over the Ghana-La Cote D\'Ivoire Technical Committee on the Determination and Reaffirmation of Land Boundary and the Implementation of International Tribunal of the Law of the Sea',
  'Co-chair of the Ghana-Burkina Cross-Border Cooperation Meetings'
]

export const operations = [
  'UNAMSIL - United Nations Mission in Sierra Leone - deployed three times',
  'UNMIL - United Nations Mission in Liberia - deployed once',
  'UNOCI - United Nations Operation in Cote d\'Ivoire - deployed thrice',
  'MONUC - United Nations Mission in the Democratic Republic of the Congo, Kinshasa - deployed once',
  'UNIFIL - United Nations Interim Force in Lebanon - deployed once, in Southern Lebanon',
  'UNMISS - United Nations Mission in South Sudan - served once',
  'ECOMIG - ECOWAS Mission in The Gambia - served once'
]

export const awards: AwardItem[] = [
  {
    title: 'UNAMSIL',
    year: 'Decoration',
    description: 'UNAMSIL decoration listed in the supplied biographic form.'
  },
  {
    title: 'UNIFIL',
    year: 'Decoration',
    description: 'UNIFIL decoration listed in the supplied biographic form.'
  },
  {
    title: 'MONUC',
    year: 'Decoration',
    description: 'MONUC decoration listed in the supplied biographic form.'
  },
  {
    title: 'UNOCI Medals',
    year: 'Decoration',
    description: 'UNOCI medals listed in the supplied biographic form.'
  },
  {
    title: 'UNMISS',
    year: 'Decoration',
    description: 'UNMISS decoration listed in the supplied biographic form.'
  }
]

export const promotionDetails: DetailItem[] = [
  { label: 'Captain', value: '22 August 2003' },
  { label: 'Major', value: '22 August 2008' }
]

export const homeCategoryLinks: CategoryLink[] = [
  { label: 'Biography', to: '/biography#overview' },
  { label: 'Biographic Form', to: '/biography#details' },
  { label: 'Service Profile', to: '/biography#service' },
  { label: 'Languages & Hobbies', to: '/biography#personal' },
  { label: 'Career Timeline', to: '/career#timeline' },
  { label: 'Work History', to: '/career#work-history' },
  { label: 'Recent Assignments', to: '/career#recent-assignments' },
  { label: 'Operational Experience', to: '/career#operational-experience' },
  { label: 'Volunteer Service', to: '/achievements#volunteer-service' },
  { label: 'Regional Service', to: '/achievements#regional-service' },
  { label: 'Decorations', to: '/awards#decorations' },
  { label: 'Professional Development', to: '/education#professional-development' },
  { label: 'Military Diplomas', to: '/education#military-diplomas' },
  { label: 'UNITAR-POCI', to: '/education#unitar-poci' },
  { label: 'Professional Courses', to: '/education#professional-courses' },
  { label: 'Gallery', to: '/gallery' }
]

export const biographyCategoryLinks: CategoryLink[] = [
  { label: 'Overview', to: '#overview' },
  { label: 'Biographic Form', to: '#details' },
  { label: 'Service Profile', to: '#service' },
  { label: 'Languages', to: '#languages' },
  { label: 'Hobbies', to: '#hobbies' }
]

export const careerCategoryLinks: CategoryLink[] = [
  { label: 'Timeline', to: '#timeline' },
  { label: 'Detailed Work History', to: '#work-history' },
  { label: 'Recent Assignments', to: '#recent-assignments' },
  { label: 'Operational Experience', to: '#operational-experience' }
]

export const achievementCategoryLinks: CategoryLink[] = [
  { label: 'Highlights', to: '#highlights' },
  { label: 'Volunteer Service', to: '#volunteer-service' },
  { label: 'Regional Service', to: '#regional-service' }
]

export const awardCategoryLinks: CategoryLink[] = [
  { label: 'Decorations', to: '#decorations' }
]

export const educationCategoryLinks: CategoryLink[] = [
  { label: 'Professional Development', to: '#professional-development' },
  { label: 'Military Diplomas', to: '#military-diplomas' },
  { label: 'UNITAR-POCI', to: '#unitar-poci' },
  { label: 'Professional Courses', to: '#professional-courses' }
]

export const welcomeFeatureImages = {
  leadership: imageAsset('leadership.png', 'Leadership', 'Leadership'),
  service: imageAsset('service.png', 'Service', 'Service'),
  excellence: imageAsset('excellence.png', 'Excellence', 'Excellence')
}

function imageAsset(relativePath: string, alt: string, caption: string): ImageAsset {
  const cleanPath = relativePath.replace(/^\//, '').replace(/\.[^.]+$/, '')
  const publicPath = cleanPath.includes('/') ? cleanPath : `root/${cleanPath}`
  const baseCloudinary = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

  const src = `${baseCloudinary}/f_auto,q_auto,w_1600/${ROOT_FOLDER}/${publicPath}`
  const fallbackSrc = `${baseCloudinary}/f_auto,q_auto/${ROOT_FOLDER}/${publicPath}`
  const thumbnailSrc = `${baseCloudinary}/f_auto,q_auto,c_fill,g_auto,w_600,h_450/${ROOT_FOLDER}/${publicPath}`
  const placeholderSrc = `${baseCloudinary}/f_auto,q_auto,w_32/${ROOT_FOLDER}/${publicPath}`
  
  const widths = [480, 768, 1200, 1600]
  const srcSet = widths
    .map((w) => `${baseCloudinary}/f_auto,q_auto,w_${w}/${ROOT_FOLDER}/${publicPath} ${w}w`)
    .join(', ')

  return {
    src,
    fallbackSrc,
    thumbnailSrc,
    placeholderSrc,
    srcSet,
    alt,
    caption,
    width: 1200,
    height: 900
  }
}
