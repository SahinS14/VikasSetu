import prisma from '../src/config/prisma';

const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export async function migrateCurriculum() {
  console.log('🚀 Starting Curriculum Migration from modulesJson to Normalized Supabase Tables...');

  // 1. Fetch all courses from database
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses in database`);

  // Define full curriculum dataset for all core courses (matching seedData.ts)
  const curriculumData: any[] = [
    // Course 1: SHG Governance
    {
      ids: ['crs-shg-101', 'crs-shg-gov-301'],
      title: 'SHG Financial Literacy & Micro-Credit Linkage',
      titleHi: 'स्वयं सहायता समूह वित्तीय साक्षरता एवं बैंक ऋण लिंकेज',
      titleMr: 'स्वयंसहाय्यता गट आर्थिक साक्षरता आणि बँक जोडणी',
      description: 'Capacity development for SHG leaders and Village Organizations on Panchasutra principles, internal lending, micro-investment plans, and NRLM interest subvention.',
      descriptionHi: 'स्वयं सहायता समूहों एवं ग्राम संगठनों हेतु पंचसूत्र सिद्धांत, आंतरिक ऋण, सूक्ष्म निवेश योजना (MIP) एवं आजीविका संवर्धन का विशेष पाठ्यक्रम।',
      descriptionMr: 'स्वयंसहाय्यता गट व ग्रामसंघांसाठी पंचसूत्री, अंतर्गत कर्जवाटप, सूक्ष्म गुंतवणूक आराखडा आणि उपजीविका विकास.',
      thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
      instituteId: 'inst-icm-lko',
      durationHours: 24,
      level: 'Beginner',
      category: 'SHG Governance',
      modules: [
        {
          id: 'mod-shg-1',
          order: 1,
          title: 'Module 1: The Panchasutra Principles of Sustainable SHGs',
          titleHi: 'मॉड्यूल 1: सशक्त स्वयं सहायता समूहों के पंचसूत्र सिद्धांत',
          titleMr: 'विभाग १: सक्षम स्वयंसहाय्यता गटांची पंचसूत्री तत्त्वे',
          lessons: [
            {
              id: 'les-shg-1-1',
              order: 1,
              title: '1.1 Deep Dive into the 5 Pillars (Panchasutra)',
              titleHi: '1.1 पंचसूत्र के 5 मुख्य आधार स्तंभ',
              titleMr: '1.1 पंचसूत्रीचे ५ आधारस्तंभ',
              durationMinutes: 20,
              contentType: 'TEXT',
              contentByLanguage: {
                en: {
                  text: 'Under the National Rural Livelihoods Mission (NRLM), every SHG qualifies for bank credit linkage by demonstrating adherence to the Panchasutra:\n\n1. Regular Weekly Meetings\n2. Regular Weekly Savings\n3. Regular Internal Lending\n4. Timely Repayment\n5. Transparent Book-Keeping',
                  keyTakeaways: ['Panchasutra grading score directly determines bank loan limit', 'Internal lending prevents usurious moneylender exploitation', 'Digital bookkeeping enables credit rating'],
                },
                hi: {
                  text: 'राष्ट्रीय ग्रामीण आजीविका मिशन (NRLM) के अंतर्गत बैंक ऋण प्राप्त करने के लिए समूह का पंचसूत्र का पालन करना अनिवार्य है।',
                  keyTakeaways: ['पंचसूत्र ग्रेडिंग से ₹20 लाख तक का बिना गारंटी ऋण मिलता है'],
                },
                mr: {
                  text: 'राष्ट्रीय ग्रामीण जीवनोन्नती अभियानांतर्गत (NRLM) बँकांकडून कर्ज मिळवण्यासाठी गटाने पंचसूत्रीचे पालन करणे अनिवार्य आहे.',
                  keyTakeaways: ['पंचसूत्रीच्या मूल्यांकनावर बँकांकडून विनातारण कर्ज मिळते'],
                },
              },
            },
            {
              id: 'les-shg-1-2',
              order: 2,
              title: '1.2 Internal Lending & Reducing Moneylender Dependency',
              titleHi: '1.2 आंतरिक ऋण एवं साहूकार निर्भरता मुक्ति',
              titleMr: '1.2 अंतर्गत कर्जवाटप आणि सावकारी पाशातून सुटका',
              durationMinutes: 25,
              contentType: 'TEXT',
              contentByLanguage: {
                en: {
                  text: 'Internal lending allows SHG members to borrow from collective savings at affordable rates (typically 1-2% monthly).',
                  keyTakeaways: ['Loans approved through collective group consensus', 'Priority given to productive livelihood needs', 'High repayment recovery rates'],
                },
                hi: {
                  text: 'आंतरिक ऋण से समूह के सदस्यों को रियायती दरों पर ऋण मिलता है।',
                  keyTakeaways: ['सामूहिक सहमति से ऋण स्वीकृति'],
                },
                mr: {
                  text: 'अंतर्गत कर्जवाटपामुळे सदस्यांना वाजवी दराने कर्ज मिळते.',
                  keyTakeaways: ['गटाच्या संमतीने कर्ज वाटप'],
                },
              },
            },
          ],
          quiz: {
            id: 'quiz-shg-1',
            title: 'SHG Panchasutra Assessment',
            titleHi: 'पंचसूत्र मूल्यांकन परीक्षा',
            titleMr: 'पंचसूत्री मूल्यांकन चाचणी',
            passThreshold: 75,
            questions: [
              {
                id: 'q-shg-1',
                question: 'Which of the following is NOT one of the traditional Panchasutra principles?',
                questionHi: 'निम्नलिखित में से कौन सा पारंपरिक पंचसूत्र का हिस्सा नहीं है?',
                questionMr: 'खालीलपैकी कोणता घटक पारंपारिक पंचसूत्रीमध्ये मोडत नाही?',
                options: {
                  en: ['Regular Weekly Meetings', 'Regular Weekly Savings', 'Mandatory Gold Purchase', 'Transparent Book-Keeping'],
                  hi: ['नियमित साप्ताहिक बैठक', 'नियमित साप्ताहिक बचत', 'अनिवार्य सोना खरीद', 'पारदर्शी बही-खाता'],
                  mr: ['नियमित बैठक', 'नियमित बचत', 'सक्तीची सोने खरेदी', 'पारदर्शक हिशोब'],
                },
                correctOptionIndex: 2, // Mandatory Gold Purchase
                explanation: {
                  en: 'Panchasutra consists of Meetings, Savings, Internal Lending, Timely Repayment, and Bookkeeping.',
                  hi: 'पंचसूत्र में बैठक, बचत, आंतरिक ऋण, समय पर वापसी और बही-खाता शामिल हैं।',
                  mr: 'पंचसूत्रीमध्ये बैठक, बचत, अंतर्गत कर्ज, परतफेड आणि हिशोब यांचा समावेश होतो.',
                },
              },
            ],
          },
        },
      ],
    },

    // Course 2: Dairy Cooperative Management
    {
      ids: ['crs-dairy-101', 'crs-dairy-mgmt-201'],
      title: 'Dairy Cooperative Cold Chain & Quality Testing',
      titleHi: 'दुग्ध सहकारी शीत श्रृंखला एवं गुणवत्ता प्रबंधन',
      titleMr: 'दुग्ध सहकारी शीत साखळी आणि गुणवत्ता नियंत्रण',
      description: 'Practical training on Automatic Milk Collection Stations (AMCS), FAT/SNF ultrasonic testing, Bulk Milk Cooler (BMC) maintenance, clean milk production, and NDDB logistics.',
      descriptionHi: 'स्वचालित दुग्ध संग्रह केंद्र (AMCS), फैट/एसएनएफ अल्ट्रासोनिक परीक्षण, बीएमसी (BMC) रख-रखाव एवं स्वच्छ दूध उत्पादन का तकनीकी प्रशिक्षण।',
      descriptionMr: 'स्वयंचलित दूध संकलन केंद्र (AMCS), फॅट/एसएनएफ चाचणी, बल्क मिल्क कुलर (BMC) देखभाल आणि गुणवत्ता व्यवस्थापन.',
      thumbnail: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      instituteId: 'inst-ricm-gdn',
      durationHours: 28,
      level: 'Intermediate',
      category: 'Dairy & Livestock',
      modules: [
        {
          id: 'mod-dairy-1',
          order: 1,
          title: 'Module 1: AMCS Operations & Milk Analyzer Calibration',
          titleHi: 'मॉड्यूल 1: एएमसीएस संचालन एवं मिल्क एनालाइजर कैलिब्रेशन',
          titleMr: 'विभाग १: स्वयंचलित दूध संकलन केंद्र आणि उपकरणे',
          lessons: [
            {
              id: 'les-dairy-1-1',
              order: 1,
              title: '1.1 Real-time FAT/SNF Testing & Direct Farmer Settlement',
              titleHi: '1.1 रीयल-टाइम फैट/एसएनएफ परीक्षण एवं प्रत्यक्ष किसान भुगतान',
              titleMr: '1.1 फॅट/एसएनएफ चाचणी आणि थेट शेतकरी बँक खात्यात जमा',
              durationMinutes: 25,
              contentType: 'TEXT',
              contentByLanguage: {
                en: {
                  text: 'Automatic Milk Collection Stations (AMCS) integrate electronic scales, ultrasonic milk analyzers, and cloud ERP for instant payment.',
                  keyTakeaways: ['Ultrasonic analyzers prevent manual tampering', 'Direct DBT credit builds farmer trust', 'Data synchronizes with District Union'],
                },
                hi: {
                  text: 'स्वचालित दुग्ध संग्रह केंद्र (AMCS) में डिजिटल जांच और तत्काल बैंक भुगतान की सुविधा होती है।',
                  keyTakeaways: ['पारदर्शिता और विश्वास में वृद्धि'],
                },
                mr: {
                  text: 'स्वयंचलित दूध संकलन केंद्र (AMCS) मुळे पारदर्शकता निर्माण होते.',
                  keyTakeaways: ['थेट बँक खात्यात पैसे जमा'],
                },
              },
            },
          ],
          quiz: {
            id: 'quiz-dairy-1',
            title: 'Dairy AMCS Quality Quiz',
            titleHi: 'दुग्ध गुणवत्ता मूल्यांकन परीक्षा',
            titleMr: 'दुग्ध गुणवत्ता चाचणी',
            passThreshold: 80,
            questions: [
              {
                id: 'q-dairy-1',
                question: 'What are the two primary parameters used to determine the purchase price of milk at cooperative societies?',
                questionHi: 'सहकारी समितियों पर दूध का खरीद मूल्य तय करने के लिए दो मुख्य मानक कौन से हैं?',
                questionMr: 'सहकारी संस्थांमध्ये दुधाचा खरेदी दर ठरवण्यासाठी कोणते दोन मुख्य घटक वापरले जातात?',
                options: {
                  en: ['FAT and SNF (Solids-Not-Fat)', 'Color and Smell only', 'Container volume only', 'Temperature and Acidity only'],
                  hi: ['फैट (FAT) एवं एसएनएफ (SNF)', 'केवल रंग एवं गंध', 'केवल बर्तन का आयतन', 'केवल तापमान'],
                  mr: ['फॅट (FAT) आणि एसएनएफ (SNF)', 'फक्त रंग आणि वास', 'फक्त भांड्याचा आकार', 'फक्त तापमान'],
                },
                correctOptionIndex: 0,
                explanation: {
                  en: 'Indian cooperative dairies determine farmer payment using a two-axis pricing formula based on FAT and SNF percentage.',
                  hi: 'भारतीय दुग्ध सहकारी समितियां फैट और एसएनएफ के प्रतिशत पर आधारित द्वि-अक्षीय मूल्य निर्धारण सूत्र का उपयोग करती हैं।',
                  mr: 'भारतीय दुग्ध सहकारी संस्था फॅट आणि एसएनएफच्या प्रमाणावर आधारित दुधाचे वाजवी दर ठरवतात.',
                },
              },
            ],
          },
        },
      ],
    },

    // Course 3: PACS Computerization
    {
      ids: ['crs-pacs-101', 'crs-pacs-erp-101'],
      title: 'PACS Computerization & ERP Operations',
      titleHi: 'पैक्स कम्प्यूटरीकरण और ERP संचालन',
      titleMr: 'PACS संगणकीकरण आणि ERP संचालन',
      description: 'Comprehensive training on computerizing Primary Agricultural Credit Societies and operating the integrated ERP system for efficient cooperative management.',
      descriptionHi: 'प्राथमिक कृषि ऋण समितियों के कम्प्यूटरीकरण और एकीकृत ERP प्रणाली के संचालन पर व्यापक प्रशिक्षण।',
      descriptionMr: 'प्राथमिक कृषी पतसंस्थांच्या संगणकीकरण आणि एकात्मिक ERP प्रणालीच्या संचालनावर सर्वसमावेशक प्रशिक्षण.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
      instituteId: 'inst-vamnicom',
      durationHours: 40,
      level: 'Intermediate',
      category: 'PACS Digitalization',
      modules: [
        {
          id: 'mod-pacs-1',
          order: 1,
          title: 'Module 1: Introduction to PACS Architecture & Common Accounting System',
          titleHi: 'मॉड्यूल 1: पैक्स संरचना एवं साझा लेखांकन प्रणाली',
          titleMr: 'विभाग १: PACS रचना आणि सामायिक लेखा पद्धती',
          lessons: [
            {
              id: 'les-pacs-1-1',
              order: 1,
              title: '1.1 PACS Three-Tier Cooperative Credit Structure in India',
              titleHi: '1.1 भारत में पैक्स की त्रि-स्तरीय सहकारी साख संरचना',
              titleMr: '1.1 भारतातील PACS ची त्रि-स्तरीय सहकारी पत रचना',
              durationMinutes: 20,
              contentType: 'TEXT',
              contentByLanguage: {
                en: {
                  text: 'PACS form the ground-level tier of India short-term cooperative credit structure, directly serving farming households with crop loans (KCC) and inputs.',
                  keyTakeaways: ['Over 95,000 PACS operate in India', 'Direct connection with DCCBs and State Cooperative Banks', 'Digitization integrates PACS into CBS'],
                },
              },
            },
          ],
          quiz: {
            id: 'quiz-pacs-1',
            title: 'PACS Basics Assessment',
            titleHi: 'पैक्स मूल्यांकन',
            titleMr: 'PACS मूल्यांकन',
            passThreshold: 70,
            questions: [
              {
                id: 'q-pacs-1',
                question: 'What is the primary mandate of Primary Agricultural Credit Societies (PACS) under the cooperative credit structure?',
                questionHi: 'सहकारी साख संरचना के तहत प्राथमिक कृषि ऋण समितियों (PACS) का मुख्य कार्य क्या है?',
                questionMr: 'सहकारी पत रचनेअंतर्गत प्राथमिक कृषी पतसंस्थांचे (PACS) मुख्य कार्य काय आहे?',
                options: {
                  en: ['To provide long-term housing loans to urban residents', 'To deliver short and medium-term production credit directly to rural farmers at the village level', 'To regulate commercial stock market operations', 'To manufacture heavy agricultural machinery exclusively'],
                  hi: ['शहरी आवास ऋण प्रदान करना', 'ग्रामीण किसानों को अल्पकालिक एवं मध्यमकालिक फसल ऋण उपलब्ध कराना', 'शेयर बाजार संचालन', 'भारी मशीनरी निर्माण'],
                  mr: ['शहरी गृहकर्ज देणे', 'ग्रामीण शेतकऱ्यांना अल्प व मध्यम मुदतीचे पीक कर्ज देणे', 'शेअर बाजार नियमन', 'अवजड यंत्रसामग्री तयार करणे'],
                },
                correctOptionIndex: 1,
                explanation: {
                  en: 'PACS deliver short-term crop loans and input supplies directly to village farmers.',
                },
              },
            ],
          },
        },
      ],
    },
  ];

  // 2. Iterate and upsert all courses, modules, lessons, quizzes, questions, and options
  for (const cData of curriculumData) {
    for (const cId of cData.ids) {
      console.log(`\n📦 Upserting Course: ${cId} (${cData.title})`);
      await prisma.course.upsert({
        where: { id: cId },
        update: {
          title: cData.title,
          titleHi: cData.titleHi,
          titleMr: cData.titleMr,
          description: cData.description,
          descriptionHi: cData.descriptionHi,
          descriptionMr: cData.descriptionMr,
          thumbnail: cData.thumbnail,
          instituteId: cData.instituteId,
          durationHours: cData.durationHours,
          level: cData.level,
          category: cData.category,
        },
        create: {
          id: cId,
          title: cData.title,
          titleHi: cData.titleHi,
          titleMr: cData.titleMr,
          description: cData.description,
          descriptionHi: cData.descriptionHi,
          descriptionMr: cData.descriptionMr,
          thumbnail: cData.thumbnail,
          instituteId: cData.instituteId,
          durationHours: cData.durationHours,
          level: cData.level,
          category: cData.category,
          modulesJson: cData.modules,
        },
      });

      // Modules
      for (const m of cData.modules) {
        const moduleId = `${cId}_${m.id}`; // unique per course if needed, or m.id
        console.log(`  🔹 Module: ${m.title}`);
        await prisma.module.upsert({
          where: { id: m.id },
          update: {
            courseId: cId,
            orderIndex: m.order,
            title: m.title,
            titleHi: m.titleHi,
            titleMr: m.titleMr,
          },
          create: {
            id: m.id,
            courseId: cId,
            orderIndex: m.order,
            title: m.title,
            titleHi: m.titleHi,
            titleMr: m.titleMr,
          },
        });

        // Lessons
        for (const l of m.lessons) {
          console.log(`    🔸 Lesson: ${l.title}`);
          await prisma.lesson.upsert({
            where: { id: l.id },
            update: {
              courseId: cId,
              moduleId: m.id,
              orderIndex: l.order,
              title: l.title,
              titleHi: l.titleHi,
              titleMr: l.titleMr,
              contentType: l.contentType || 'TEXT',
              durationMinutes: l.durationMinutes || 15,
              contentEn: l.contentByLanguage?.en || null,
              contentHi: l.contentByLanguage?.hi || null,
              contentMr: l.contentByLanguage?.mr || null,
              isPublished: true,
            },
            create: {
              id: l.id,
              courseId: cId,
              moduleId: m.id,
              orderIndex: l.order,
              title: l.title,
              titleHi: l.titleHi,
              titleMr: l.titleMr,
              contentType: l.contentType || 'TEXT',
              durationMinutes: l.durationMinutes || 15,
              contentEn: l.contentByLanguage?.en || null,
              contentHi: l.contentByLanguage?.hi || null,
              contentMr: l.contentByLanguage?.mr || null,
              isPublished: true,
            },
          });
        }

        // Quiz
        if (m.quiz) {
          console.log(`    🎯 Quiz: ${m.quiz.title} (Pass Threshold: ${m.quiz.passThreshold}%)`);
          await prisma.quiz.upsert({
            where: { id: m.quiz.id },
            update: {
              courseId: cId,
              moduleId: m.id,
              title: m.quiz.title,
              titleHi: m.quiz.titleHi,
              titleMr: m.quiz.titleMr,
              passThreshold: m.quiz.passThreshold,
              isPublished: true,
            },
            create: {
              id: m.quiz.id,
              courseId: cId,
              moduleId: m.id,
              title: m.quiz.title,
              titleHi: m.quiz.titleHi,
              titleMr: m.quiz.titleMr,
              passThreshold: m.quiz.passThreshold,
              isPublished: true,
            },
          });

          // Quiz Questions
          for (let qIdx = 0; qIdx < m.quiz.questions.length; qIdx++) {
            const q = m.quiz.questions[qIdx];
            console.log(`      ❓ Question ${qIdx + 1}: ${q.question.substring(0, 60)}...`);
            await prisma.quizQuestion.upsert({
              where: { id: q.id },
              update: {
                quizId: m.quiz.id,
                orderIndex: qIdx + 1,
                questionText: q.question,
                questionTextHi: q.questionHi,
                questionTextMr: q.questionMr,
                explanationEn: q.explanation?.en,
                explanationHi: q.explanation?.hi,
                explanationMr: q.explanation?.mr,
              },
              create: {
                id: q.id,
                quizId: m.quiz.id,
                orderIndex: qIdx + 1,
                questionText: q.question,
                questionTextHi: q.questionHi,
                questionTextMr: q.questionMr,
                explanationEn: q.explanation?.en,
                explanationHi: q.explanation?.hi,
                explanationMr: q.explanation?.mr,
              },
            });

            // Quiz Options
            const enOpts = q.options?.en || [];
            const hiOpts = q.options?.hi || [];
            const mrOpts = q.options?.mr || [];
            const optCount = Math.max(enOpts.length, hiOpts.length, mrOpts.length);

            for (let oIdx = 0; oIdx < optCount; oIdx++) {
              const optId = `${q.id}-${letters[oIdx] || oIdx}`;
              const isCorrect = oIdx === q.correctOptionIndex;

              await prisma.quizOption.upsert({
                where: { id: optId },
                update: {
                  questionId: q.id,
                  optionIndex: oIdx,
                  optionText: enOpts[oIdx] || '',
                  optionTextHi: hiOpts[oIdx] || null,
                  optionTextMr: mrOpts[oIdx] || null,
                  isCorrect,
                },
                create: {
                  id: optId,
                  questionId: q.id,
                  optionIndex: oIdx,
                  optionText: enOpts[oIdx] || '',
                  optionTextHi: hiOpts[oIdx] || null,
                  optionTextMr: mrOpts[oIdx] || null,
                  isCorrect,
                },
              });
            }
          }
        }
      }
    }
  }

  console.log('\n✅ Curriculum Migration Complete! All normalized tables populated in Supabase.');
}

if (require.main === module) {
  migrateCurriculum()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
