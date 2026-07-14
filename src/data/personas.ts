import { PersonaConfig } from '../types';

export const PERSONAS: PersonaConfig[] = [
  {
    id: 'general',
    name: 'Aqlli Yordamchi',
    icon: 'Sparkles',
    description: 'Kundalik savollar, tarjima, matn tahriri va umumiy mavzularda yordam beradi.',
    systemInstruction: '',
    placeholder: 'Aqlli yordamchidan biror narsa so\'rang...',
    suggestions: [
      'Insoniyatning eng buyuk 5 ta kashfiyoti haqida ma\'lumot ber',
      'Matnni ingliz tiliga tarjima qilib ber: "Men bugun juda muhim topshiriqni bajardim"',
      'Miya faoliyatini yaxshilash uchun 5 ta foydali odatni sanab o\'t',
      'Yaxshi uxlash uchun kechki tartib qanday bo\'lishi kerak?'
    ]
  },
  {
    id: 'coder',
    name: 'Dasturchi AI',
    icon: 'Code2',
    description: 'Kod yozish, xatolarni tuzatish va texnik savollarga mukammal javob beradi.',
    systemInstruction: '',
    placeholder: 'Dasturlash bo\'yicha savolingizni yozing...',
    suggestions: [
      'React-da custom hook qanday yaratiladi? Oddiy misol keltir.',
      'JavaScript-da "closure" tushunchasini sodda qilib tushuntir.',
      'Python-da API-dan ma\'lumot oluvchi funksiya yozib ber.',
      'SQL-da ikkita jadvalni birlashtirish (JOIN) turlari qanday?'
    ]
  },
  {
    id: 'writer',
    name: 'Ijodkor Yozuvchi',
    icon: 'PenTool',
    description: 'Matnlar, she\'rlar, ijtimoiy tarmoq postlari va maqolalar yozish bo\'yicha mutaxassis.',
    systemInstruction: '',
    placeholder: 'Ijodiy mavzu yoki topshiriq bering...',
    suggestions: [
      'Sun\'iy intellektning kelajagi haqida ta\'sirchan qisqa hikoya yozib ber.',
      'Yangi ochilgan qahvaxona uchun ijtimoiy tarmoq reklama postini tayyorla.',
      'Do\'stlik haqida samimiy va chiroyli she\'r yozib ber.',
      'Ushbu gapni yanada jozibali qil: "Yomg\'ir yog\'ayotgan edi va men uning kelishini kutardim"'
    ]
  },
  {
    id: 'teacher',
    name: 'Mehribon Ustoz',
    icon: 'GraduationCap',
    description: 'Murakkab mavzularni sodda, qiziqarli va hayotiy misollar bilan o\'rgatadi.',
    systemInstruction: '',
    placeholder: 'O\'rganmoqchi bo\'lgan mavzungizni kiriting...',
    suggestions: [
      'Eynshteynning nisbiylik nazariyasini 10 yoshli bolaga tushuntirgandek sodda qilib ayt.',
      'Ingliz tilidagi "Present Perfect" zamonini misollar bilan tushuntir.',
      'Fotosintez jarayoni qanday sodir bo\'ladi? Qadam-baqadam o\'rgat.',
      'Kriptovalyuta va Blokcheyn nima? Hayotiy misol bilan tushuntir.'
    ]
  },
  {
    id: 'analyst',
    name: 'Ma\'lumotlar Tahlilchisi',
    icon: 'BarChart3',
    description: 'Biznes, moliya, statistika va jadvallar bilan ishlashda yordam beradi.',
    systemInstruction: '',
    placeholder: 'Tahlil qilinadigan ma\'lumot yoki vazifani kiriting...',
    suggestions: [
      'Yangi boshlanayotgan biznes uchun xarajatlar va daromadlar rejasini tuzishga yordam ber.',
      'Sotuvlar hajmini oshirish bo\'yicha qadam-baqadam marketing tahlili qilib ber.',
      'Excel-da eng ko\'p ishlatiladigan 10 ta tahliliy formulani jadval qilib ko\'rsat.',
      'Shaxsiy byudjetni boshqarishda 50/30/20 qoidasi nima va u qanday ishlaydi?'
    ]
  }
];
