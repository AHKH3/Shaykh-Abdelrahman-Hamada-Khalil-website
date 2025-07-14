document.addEventListener('DOMContentLoaded', function() {
    // Language switcher
    const languageSwitcher = document.querySelector('.language-switcher');
    const langDropdown = languageSwitcher.querySelector('.dropdown-content');

    languageSwitcher.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
    });

    langDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    document.querySelectorAll('.dropdown-content a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.dataset.lang;
            updateContent(lang);
            languageSwitcher.classList.remove('active');
        });
    });

    document.addEventListener('click', function() {
        if (languageSwitcher.classList.contains('active')) {
            languageSwitcher.classList.remove('active');
        }
    });

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Back to top button
    const backToTopButton = document.getElementById('back-to-top');

    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });

        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');

            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
                q.nextElementSibling.style.padding = '0 35px';
            });

            if (!isActive) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
                answer.style.padding = '25px 35px 30px 35px';
            }
        });
    });

    // Animate on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in, .scale-in').forEach(el => {
        observer.observe(el);
    });

    // Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Pricing calculator
    calculateAllPrices();

    // Newsletter Form Submission
    const newsletterForm = document.getElementById('newsletterForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');
    const newsletterEmailInput = document.getElementById('newsletterEmail');

    if (newsletterForm && successModal && closeModal && newsletterEmailInput) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // In a real application, you would send the email to a server here.
            // For this static site, we'll just show the success message.
            successModal.classList.add('show');
            newsletterEmailInput.value = ''; // Clear the input field
        });

        closeModal.addEventListener('click', function() {
            successModal.classList.remove('show');
        });

        window.addEventListener('click', function(e) {
            if (e.target == successModal) {
                successModal.classList.remove('show');
            }
        });
    }
});

function calculatePackagePrice(packageType) {
    const prices = {
        'group-kids': { 1: 400, 2: 750, 3: 1050, 4: 1300, 5: 1500, 6: 1700 },
        'group-adults': { 1: 500, 2: 950, 3: 1350, 4: 1700, 5: 2000, 6: 2250 },
        'kids': { 20: 150, 30: 200, 40: 250, 60: 300 },
        'adults': { 20: 200, 30: 250, 40: 300, 60: 350 },
        'ijazah': { 20: 250, 30: 300, 45: 350, 60: 400 }
    };

    let frequency = 1, duration = 20, basePrice = 0;

    if (packageType.startsWith('group')) {
        frequency = document.getElementById(`${packageType}-frequency`).value;
        basePrice = prices[packageType][frequency];
    } else {
        duration = document.getElementById(`${packageType}-duration`).value;
        frequency = document.getElementById(`${packageType}-frequency`).value;
        basePrice = prices[packageType][duration] * frequency;
    }

    document.getElementById(`${packageType}-total-price`).textContent = basePrice;
}

function calculateAllPrices() {
    const packages = ['group-kids', 'group-adults', 'kids', 'adults', 'ijazah'];
    packages.forEach(pkg => {
        if (document.getElementById(`${pkg}-total-price`)) {
            calculatePackagePrice(pkg);
        }
    });
}

// Translations
const translations = {
    'ar': {
        'page-title': 'موقع الشيخ عبدالرحمن حماده خليل',
        'logo-alt': 'شعار الشيخ عبد الرحمن حماده خليل',
        'nav-home': 'الرئيسية',
        'nav-about': 'عن الشيخ',
        'nav-ijazat': 'الإجازات والمؤهلات',
        'nav-packages': 'باقاتنا',
        'nav-why-us': 'لماذا تختارنا؟',
        'nav-faq': 'الأسئلة الشائعة',
        'nav-contact': 'تواصل معنا',
        'current-lang-display': 'العربية',
        'hero-h1': 'تعلم تلاوة القرءان الكريم بالتجويد واحصل على إجازة بالسند المتصل',
        'hero-p': 'انطلق في رحلتك القرآنية معنا. نُقدم لك تعليماً مُيسراً، تجربة فريدة في تعلم كتاب الله.',
        'hero-btn': 'ابدأ رحلتك القرآنية الآن',
        'about-h2': 'عن الشيخ عبد الرحمن حماده خليل',
        'about-img-alt': 'صورة الشيخ عبد الرحمن حماده خليل',
        'about-h3': 'نبذة عن مسيرتي في خدمة القرآن',
        'about-p1': 'الحمد لله رب العالمين، والصلاة والسلام على خاتم الأنبياء والمرسلين. أنا الشيخ عبد الرحمن حماده خليل، طالب بكلية اللغات والترجمة بقسم الأدب الصيني بجامعة الأزهر، ومعلم ومجاز في القرآن الكريم. لقد كرست حياتي لخدمة كتاب الله العزيز، وتلقيت العلم من شيوخ أجلاء وحصلت على الإجازات الشرعية التي تؤهلني لتعليم وإقراء كتاب الله بسندٍ متصل إلى نبينا الكريم محمد صلى الله عليه وسلم.',
        'about-p2': 'أؤمن بأن تعلم القرآن هو رحلة نور وسكينة، وأن كل طالب يستحق أن يتلقى العلم بأفضل الطرق وأيسرها. لهذا، أقدم لكم عبر هذه المنصة منهجي التعليمي الذي يجمع بين أصالة التلقي ومتطلبات التعليم الحديث عن بُعد، لكي تتمكنوا من إتقان التلاوة، وتجويد الحروف، وتحقيق الإجازة، وأن تكونوا من أهل القرآن الذين هم أهل الله وخاصته. لدي خبرة كمعلم قرآن أونلاين في أكاديمية رفرف (يوليو 2024 - الوقت الحاضر) ومعلم قرآن أونلاين (عمل حر) منذ يوليو 2021، ومعلم قرآن أوفلاين (عمل حر) منذ نوفمبر 2024.',
        'about-p3': 'أسأل الله تعالى أن يتقبل منا ومنكم صالح الأعمال، وأن يجعلنا جميعاً خداماً لكتابه الكريم.',
        'ijazat-h2': 'الإجازات والمؤهلات',
        'ijaza-card1-h3': 'الإجازات القرآنية',
        'ijaza-card1-p': 'أتشرف بحمل عدة إجازات قرآنية بالسند المتصل إلى رسول الله صلى الله عليه وسلم، مما يضمن دقة وصحة التلاوة التي سأنقلها إليكم.',
        'ijaza-card1-li1': 'إجازة برواية حفص عن عاصم من طريق الشاطبية (من فضيلة الشيخ عزب محمود).',
        'ijaza-card1-li2': 'إجازة بقراءة الإمام عاصم بروايتي حفص وشعبة من طريق الشاطبية (من فضيلة الشيخة حنان محمد عبد العزيز).',
        'ijaza-card1-li3': 'إجازة بقراءة الإمام حمزة بروايتي خلف وخلاد من طريق الشاطبية (من فضيلة الشيخ هاني منصور الشرقاوي).',
        'ijaza-card1-li4': 'تلقي القرآن عن شيوخ أجلاء مشهود لهم بالعلم والفضل.',
        'ijaza-card2-h3': 'المؤهلات التعليمية والخبرات',
        'ijaza-card2-p': 'إلى جانب الإجازات القرآنية، أمتلك مؤهلات تعليمية وخبرة عملية واسعة في تدريس القرآن الكريم وعلومه.',
        'ijaza-card2-li1': 'طالب بكلية اللغات والترجمة، قسم الأدب الصيني، جامعة الأزهر.',
        'ijaza-card2-li2': 'خبرة كمعلم قرآن أونلاين (أكاديمية رفرف وعمل حر) ومعلم قرآن أوفلاين.',
        'ijaza-card2-li3': 'منهجية تعليمية مرنة ومخصصة تناسب احتياجات كل طالب.',
        'ijaza-card2-li4': 'مهارات تواصل ممتازة لضمان بيئة تعليمية محفزة.',
        'packages-h2': 'باقاتنا التعليمية',
        'package1-h3': 'الباقة الجماعية للأطفال',
        'package1-desc': 'دروس جماعية ممتعة ومحفزة للأطفال (5 طلاب)، ساعة كاملة للحصة.',
        'package1-availability': 'متاحة كل يوم ما عدا الجمعة.',
        'package2-h3': 'الباقة الجماعية للبالغين',
        'package2-desc': 'دروس جماعية مركزة للبالغين (3 طلاب)، ساعة كاملة للحصة.',
        'package2-availability': '',
        'package3-h3': 'الباقة الفردية للأطفال',
        'package3-desc': 'اهتمام شخصي وتركيز كامل على طفلك.',
        'select-duration-label': 'مدة الحصة:',
        'duration-20min': '20 دقيقة',
        'duration-30min': '30 دقيقة',
        'duration-40min': '40 دقيقة',
        'duration-45min': '45 دقيقة',
        'duration-60min': '60 دقيقة',
        'select-frequency-label': 'عدد الحصص أسبوعياً:',
        'frequency-1': '1 يوم',
        'frequency-2': '2 أيام',
        'frequency-3': '3 أيام',
        'frequency-4': '4 أيام',
        'frequency-5': '5 أيام',
        'frequency-6': '6 أيام',
        'total-monthly-price-label': 'الإجمالي الشهري:',
        'package3-flexibility': 'مرونة في تحديد المواعيد.',
        'package4-h3': 'الباقة الفردية للبالغين',
        'package4-desc': 'تطوير مستواك القرآني بتركيز كامل ودعم شخصي.',
        'package4-flexibility': 'مرونة في تحديد المواعيد.',
        'package5-h3': 'باقة الإجازة بالسند',
        'package5-desc': 'مسار مخصص لإتقان القرآن والحصول على الإجازة بالسند المتصل برواية حفص أو بقراءة عاصم.',
        'package-btn': 'احجز الآن',
        'feature-flexibility': 'مرونة في تحديد المواعيد',
        'feature-postpone-cancel': 'إمكانية تأجيل أو إلغاء الحلقة',
        'feature-custom-plan': 'خطة مخصصة حسب ما يرغب به الطالب',
        'feature-ijazah-free': 'الإجازة مجانية',
        'newsletter-h2': 'اشترك في نشرتنا البريدية',
        'newsletter-p': 'ابق على اطلاع بآخر أخبارنا، الدورات الجديدة، والمقالات القرآنية المفيدة مباشرة في بريدك الوارد.',
        'newsletter-email-placeholder': 'أدخل بريدك الإلكتروني',
        'newsletter-subscribe-btn': 'اشترك الآن',
        'faq-h2': 'الأسئلة الشائعة',
        'faq-q0': 'ما هي الإجازة؟',
        'faq-a0': 'هي رخصة وشهادة من شيخ مجاز له سند متصل بالنبي صلى الله عليه وسلم، وهي شهادة من الشيخ أنك قرأت القرآن الكريم كاملاً بأحكام التجويد والتلاوة الصحيحة غيباً عن ظهر قلب، ورخصة قراءة وإقراء، أي أن تعلم من بعدك من طلبة العلم.',
        'faq-q1': 'ما هي شروط الحصول على الإجازة؟',
        'faq-a1': 'الشرط الأساسي عند كل المشايخ والمقرئين هو قراءة القرآن الكريم كاملاً قراءة صحيحة بأحكام التجويد غيباً عن ظهر قلب. وقد يزيد كل شيخ من الشروط حسب طريقته وأسلوبه كأن يكون هناك اختبار بعد إنهاء الختمة مثلاً.',
        'faq-q2': 'هل الدروس متاحة للمبتدئين؟',
        'faq-a2': 'نعم، إذا كنت تجيد قراءة اللغة العربية فيمكنك البدء معنا من الصفر لتعلم تلاوة القرآن الكريم وتجويده وحتى الحصول على إجازة بالسند المتصل إلى رسول الله صلى الله عليه وسلم.',
        'faq-q3': 'ما هي المنصات المستخدمة للتعليم عن بُعد؟',
        'faq-a3': 'نستخدم منصات تعليمية مرنة وموثوقة مثل Zoom أو Google Meet، مما يتيح تجربة تعليمية تفاعلية ومريحة من أي مكان في العالم.',
        'faq-q4': 'كيف يمكنني حجز جلسة تجريبية مجانية؟',
        'faq-a4': 'يمكنك حجز جلسة تجريبية مجانية مباشرة من خلال هذه الصفحة، أو يمكنك التواصل معنا وحجز جلستك التجريبية من خلال واتساب.',
        'contact-h2': 'تواصل معنا واحجز جلستك المجانية',
        'contact-info-h3': 'معلومات التواصل',
        'contact-info-email': '<i class="fas fa-envelope"></i> البريد الإلكتروني: abdelrahmanhamada3342@gmail.com',
        'contact-info-whatsapp': '<i class="fab fa-whatsapp"></i> واتساب: +201001947998',
        'contact-info-location': '<i class="fas fa-map-marker-alt"></i> الموقع: العاشر من رمضان، الشرقية، مصر (خدمة عالمية)',
        'contact-info-p-general': 'لا تتردد في الاتصال بنا. نحن هنا لخدمتك والإجابة على استفساراتك.',
        'booking-form-h3': 'احجز جلستك التجريبية المجانية',
        'modal-h3': 'تم إرسال طلبك بنجاح!',
        'modal-p': 'شكراً لك! لقد تم استلام طلبك. سنتواصل معك قريباً جداً.',
        'modal-close-btn': 'حسناً',
        'footer-col1-h3': 'عن الشيخ',
        'footer-col1-p': 'الشيخ عبد الرحمن حماده خليل، معلم ومجاز في القرآن الكريم بسند متصل، ملتزم بنشر علم كتاب الله وتقديم تعليم قرآني متميز للعالم أجمع.',
        'footer-col2-h3': 'روابط سريعة',
        'nav-home-footer': 'الرئيسية',
        'nav-about-footer': 'عن الشيخ',
        'nav-ijazat-footer': 'الإجازات',
        'nav-packages-footer': 'باقاتنا',
        'nav-faq-footer': 'الأسئلة الشائعة',
        'nav-contact-footer': 'تواصل معنا',
        'footer-col3-h3': 'ابق على تواصل',
        'footer-col3-email': '<i class="fas fa-envelope"></i> abdelrahmanhamada3342@gmail.com',
        'footer-col3-whatsapp': '<i class="fab fa-whatsapp"></i> +201001947998',
        'copyright': '© <span id="current-year"></span> الشيخ عبد الرحمن حماده خليل. جميع الحقوق محفوظة.',
    },
    'en': {
        'page-title': 'Shaykh Abdelrahman Hamada Khalil Website',
        'logo-alt': 'Shaykh Abdelrahman Hamada Khalil Logo',
        'nav-home': 'Home',
        'nav-about': 'About Shaykh',
        'nav-ijazat': 'Certifications & Qualifications',
        'nav-packages': 'Our Packages',
        'nav-why-us': 'Why Choose Us?',
        'nav-faq': 'FAQ',
        'nav-contact': 'Contact Us',
        'current-lang-display': 'English',
        'hero-h1': 'Learn Quranic Recitation with Tajweed and Obtain an Ijazah with a Connected Sanad',
        'hero-p': 'Embark on your Quranic journey with us. We offer accessible education and a unique experience in learning the Book of Allah.',
        'hero-btn': 'Start Your Quranic Journey Now',
        'about-h2': 'About Shaykh Abdelrahman Hamada Khalil',
        'about-img-alt': 'Shaykh Abdelrahman Hamada Khalil',
        'about-h3': 'My Journey in Serving the Quran',
        'about-p1': 'All praise is due to Allah, Lord of the Worlds, and prayers and peace be upon the Seal of the Prophets and Messengers. I am Shaykh Abdelrahman Hamada Khalil, a student at Al-Azhar University, Faculty of Languages and Translation, Chinese Literature Department, and a certified and qualified teacher of the Holy Quran. I have dedicated my life to serving the Noble Book of Allah, having received knowledge from esteemed scholars and obtained religious certifications that qualify me to teach and recite the Book of Allah with a connected chain of narration (Sanad) back to our Noble Prophet Muhammad (peace be upon him).',
        'about-p2': 'I believe that learning the Quran is a journey of light and tranquility, and that every student deserves to receive knowledge in the best and easiest ways. Therefore, through this platform, I offer my educational methodology that combines the authenticity of traditional reception with the requirements of modern distance learning, so that you can master recitation, perfect Tajweed, achieve certification (Ijazah), and become among the people of the Quran, who are the people of Allah and His chosen ones. I have experience as an online Quran teacher at Rafraf Academy (July 2024 - Present), a freelance online Quran teacher since July 2021, and a freelance offline Quran teacher since November 2024.',
        'about-p3': 'I ask Allah Almighty to accept our good deeds and yours, and to make us all servants of His Noble Book.',
        'ijazat-h2': 'Certifications & Qualifications',
        'ijaza-card1-h3': 'Quranic Certifications (Ijazat)',
        'ijaza-card1-p': 'I am honored to hold several Quranic certifications with a connected Sanad to the Messenger of Allah (peace be upon him), ensuring the accuracy and authenticity of the recitation I will convey to you.',
        'ijaza-card1-li1': 'Ijazah in Hafs from Asim narration via Al-Shatibiyyah (from Shaykh Azab Mahmoud).',
        'ijaza-card1-li2': 'Ijazah in Imam Asim\'s recitation with Hafs and Shu\'bah narrations via Al-Shatibiyyah (from Shaykhah Hanan Mohamed Abdel Aziz).',
        'ijaza-card1-li3': 'Ijazah in Imam Hamza\'s recitation with Khalaf and Khallad narrations via Al-Shatibiyyah (from Shaykh Hany Mansour El-Sharqawy).',
        'ijaza-card1-li4': 'Received the Quran from esteemed scholars known for their knowledge and virtue.',
        'ijaza-card2-h3': 'Educational Qualifications & Experience',
        'ijaza-card2-p': 'In addition to Quranic certifications, I possess educational qualifications and extensive practical experience in teaching the Holy Quran and its sciences.',
        'ijaza-card2-li1': 'Student at Al-Azhar University, Faculty of Languages and Translation, Chinese Literature Department.',
        'ijaza-card2-li2': 'Experience as an online Quran teacher (Rafraf Academy and freelance) and an offline Quran teacher.',
        'ijaza-card2-li3': 'Flexible and personalized teaching methodology to suit each student\'s needs.',
        'ijaza-card2-li4': 'Excellent communication skills to ensure a motivating learning environment.',
        'packages-h2': 'Our Educational Packages',
        'package1-h3': 'Kids Group Package',
        'package1-desc': 'Fun and motivating group lessons for children (5 students), one full hour per session.',
        'package1-availability': 'Available every day except Friday.',
        'package2-h3': 'Adults Group Package',
        'package2-desc': 'Focused group lessons for adults (3 students), one full hour per session.',
        'package2-availability': '',
        'package3-h3': 'Kids Individual Package',
        'package3-desc': 'Personalized attention and full focus on your child.',
        'select-duration-label': 'Session Duration:',
        'duration-20min': '20 Minutes',
        'duration-30min': '30 Minutes',
        'duration-40min': '40 Minutes',
        'duration-45min': '45 Minutes',
        'duration-60min': '60 Minutes',
        'select-frequency-label': 'Sessions per Week:',
        'frequency-1': '1 Day',
        'frequency-2': '2 Days',
        'frequency-3': '3 Days',
        'frequency-4': '4 Days',
        'frequency-5': '5 Days',
        'frequency-6': '6 Days',
        'total-monthly-price-label': 'Total Monthly:',
        'package3-flexibility': 'Flexible scheduling.',
        'package4-h3': 'Adults Individual Package',
        'package4-desc': 'Develop your Quranic level with full focus and personal support.',
        'package4-flexibility': 'Flexible scheduling.',
        'package5-h3': 'Ijazah with Sanad Package',
        'package5-desc': 'A dedicated track to master the Quran and obtain an Ijazah with a connected Sanad in Hafs or Asim recitation.',
        'package-btn': 'Enroll Now',
        'feature-flexibility': 'Flexible scheduling',
        'feature-postpone-cancel': 'Possibility to postpone or cancel the session',
        'feature-custom-plan': 'Customized plan according to student\'s wishes',
        'feature-ijazah-free': 'Ijazah is free',
        'newsletter-h2': 'Subscribe to Our Newsletter',
        'newsletter-p': 'Stay updated with our latest news, new courses, and beneficial Quranic articles directly in your inbox.',
        'newsletter-email-placeholder': 'Enter your email address',
        'newsletter-subscribe-btn': 'Subscribe Now',
        'faq-h2': 'Frequently Asked Questions',
        'faq-q0': 'What is an Ijazah?',
        'faq-a0': 'It is a license and certificate from a certified Shaykh with a connected Sanad to the Prophet (peace be upon him). It is a certificate from the Shaykh that you have recited the entire Holy Quran correctly with Tajweed rules by heart, and a license to recite and teach, meaning you can teach subsequent students of knowledge.',
        'faq-q1': 'What are the requirements to obtain an Ijazah?',
        'faq-a1': 'The primary condition for all Shaykhs and reciters is to recite the entire Holy Quran correctly with Tajweed rules by heart. Each Shaykh may add additional conditions based on their method and style, such as an exam after completing the recitation.',
        'faq-q2': 'Are the lessons available for beginners?',
        'faq-a2': 'Yes, if you can read Arabic, you can start with us from scratch to learn Quranic recitation and Tajweed, and even obtain an Ijazah with a connected Sanad to the Messenger of Allah (peace be upon him).',
        'faq-q3': 'What platforms are used for distance learning?',
        'faq-a3': 'We use flexible and reliable learning platforms such as Zoom or Google Meet, which provide an interactive and comfortable learning experience from anywhere in the world.',
        'faq-q4': 'How can I book a free trial session?',
        'faq-a4': 'You can book a free trial session directly through this page, or you can contact us and book your trial session via WhatsApp.',
        'contact-h2': 'Contact Us and Book Your Free Session',
        'contact-info-h3': 'Contact Information',
        'contact-info-email': '<i class="fas fa-envelope"></i> Email: abdelrahmanhamada3342@gmail.com',
        'contact-info-whatsapp': '<i class="fab fa-whatsapp"></i> WhatsApp: +201001947998',
        'contact-info-location': '<i class="fas fa-map-marker-alt"></i> Location: 10th of Ramadan City, Sharqia, Egypt (Global Service)',
        'contact-info-p-general': 'Do not hesitate to contact us. We are here to serve you and answer your inquiries.',
        'booking-form-h3': 'Book Your Free Trial Session',
        'modal-h3': 'Your Request Has Been Sent Successfully!',
        'modal-p': 'Thank you! Your request has been received. We will contact you very soon.',
        'modal-close-btn': 'Okay',
        'footer-col1-h3': 'About Shaykh',
        'footer-col1-p': 'Shaykh Abdelrahman Hamada Khalil, a certified and qualified teacher of the Holy Quran with a connected Sanad, is committed to spreading the knowledge of Allah\'s Book and providing distinguished Quranic education worldwide.',
        'footer-col2-h3': 'Quick Links',
        'nav-home-footer': 'Home',
        'nav-about-footer': 'About Shaykh',
        'nav-ijazat-footer': 'Certifications',
        'nav-packages-footer': 'Our Packages',
        'nav-faq-footer': 'FAQ',
        'nav-contact-footer': 'Contact Us',
        'footer-col3-h3': 'Stay Connected',
        'footer-col3-email': '<i class="fas fa-envelope"></i> abdelrahmanhamada3342@gmail.com',
        'footer-col3-whatsapp': '<i class="fab fa-whatsapp"></i> +201001947998',
        'copyright': '© <span id="current-year"></span> Shaykh Abdelrahman Hamada Khalil. All Rights Reserved.',
    }
};

function updateContent(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.dataset.key;
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
                element.alt = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        } else {
            // console.warn(`Translation key "${key}" not found for language "${lang}".`);
        }
    });
}