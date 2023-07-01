const messages = {
    welcome: (name) => `Привет!👋
Я нетворкинг бот сообщества minders для встреч один на один. Мы объединяем фаундеров, инвесторов, IT профессионалов и просто хороших людей на Бали 🤖

Каждую неделю я буду предлагать тебе для встречи интересного человека, специально подобранного для тебя среди других участников сообщества.

Чтобы принять участие во встречах, нужно заполнить анкету.💡
Если у меня уже есть какие-то данные о тебе, я пропущу соответствующие вопросы.`,
    foundProfile: () => `Кажется нашел! Проверь все ли совпало`,
    notFoundProfile: () => `К сожалению не нашел 😞, отправил сообщение админу, он скоро придет к тебе на помощь`,
    noHobbies: () => `-`,
    noSkills: () => `-`,
    noRequests: () => `-`,
    noSuperpower: () => `-`,

}

const userDataDict = {
    name: 'Имя',
    profile_photo_url: 'Фото',
    description: 'Описание',
    requests: 'Запросы',
    superpower: 'Суперсила',
    skills: 'Навыки',
    hobbies: 'Увлечения',
    groups: 'К какой группе относитесь',
}
const groupsDict = ['Я инвестор', 'Я основатель', 'Я специалист', 'Я творческая личность']
const skillsDict = [
    {id: 'analytics', name: '📊 Аналитика'},
    {id: 'blockchain', name: '🔗 Блокчейн'},
    {id: 'bizdev', name: '😎 Бизнес развитие'},
    {id: 'dataScience', name: '👩‍🔬Data Science'},
    {id: 'ecommerce', name: '🛍️ E-commerce'},
    {id: 'consulting', name: '🧠 Консалтинг'},
    {id: 'logistics', name: '🚚 Логистика'},
    {id: 'leadership', name: '🦸‍♀️ Лидерство'},
    {id: 'mobileDev', name: '📲 Мобильная разработка'},
    {id: 'eventManagement', name: '📆 Организация мероприятий'},
    {id: 'operationsManagement', name: '🔨 Операционный менеджмент'},
    {id: 'programming', name: '💻 Программирование'},
    {id: 'advertisement', name: '📈Реклама и маркетинг'},
    {id: 'startups', name: '🚀 Стартапы'},
    {id: 'finance', name: '💰 Финансы'},
    {id: 'productManagement', name: '🎯 Управление продуктом'},
    {id: 'hr', name: '👥 HR'},
    {id: 'investment', name: '💵 Инвестиции'},
    {id: 'uxUiDesign', name: '🎨 UX/UI дизайн'},
    {id: 'law', name: '⚖️ Юриспруденция'},
    // {id: 'sales', name: '💼 Продажи'},
    // {id: 'marketing', name: '📈 Маркетинг'},
    // {id: 'projectManagement', name: '📝 Проект-менеджмент'},
    // {id: 'innovations', name: '💡 Инновации'},
    // {id: 'seo', name: '🔎 SEO/SEM'},
    // {id: 'copyrighting', name: '🖊️ Копирайтинг'},
    // {id: 'smm', name: '📱 SMM'},
    // {id: 'pr', name: '📢 PR'},
];

const hobbiesDict = [
    {id: 'activeTime', name: '🏃‍♀️ Активный отдых и спорт'},
    {id: 'cars', name: '🚗 Автомобили и мотоциклы'},
    {id: 'vine', name: '🍷 Вина и гастрономия'},
    {id: 'volunteering', name: '🤝 Волонтерство'},
    {id: 'language', name: '🗣️ Изучение языков'},
    {id: 'culture', name: '🎨 Искусство и культура'},
    {id: 'pets', name: '😼 Животные'},
    {id: 'mindfulness', name: '‍🧘️ Йога и медитация'},
    {id: 'health', name: '🍎 Здоровый образ жизни'},
    {id: 'cooking', name: '🍳 Кулинария'},
    {id: 'literature', name: '📚 Литература'},
    {id: 'fashion', name: '👗 Мода и стиль'},
    {id: 'music', name: '🎵 Музыка'},
    {id: 'science', name: '🔬 Наука и технологии'},
    {id: 'adventure', name: '️🏕 Походы и природа'},
    {id: 'travel', name: '🌍 Путешествия и экспедиции'},
    {id: 'gardening', name: '🌱 Садоводство'},
    {id: 'photography', name: '📸 Фото и видео'},
    {id: 'handmade', name: '👐 Хендмейд'},
    {id: 'ecology', name: '🌳 Экология'},
    // {id: 'dance', name: '💃 Танцы'},
    // {id: 'cinema', name: '🎬 Кино и театр'},
    // {id: 'socialNetwork', name: '📱 Социальные сети'},
    // {id: 'gaming', name: '🕹Видеоигры'},
    // {id: 'boardGames', name: '🎲 Настольные игры'},
    // {id: 'hiking', name: '⛰Хайкинг'},
    // {id: 'running', name: '👟 Бег'},
    // {id: 'tennis', name: '🎾 Теннис/Падел/Сквош'},
    // {id: 'badminton', name: '🏸 Бадминтон'},
    // {id: 'surfing', name: '🏄‍♀️ Серфинг'},
    // {id: 'skate', name: '🛹️ Скейтборд'},
    // {id: 'snowboard', name: '🏂️ Сноуборд'},
];

module.exports = {messages, userDataDict, skillsDict, hobbiesDict, groupsDict}