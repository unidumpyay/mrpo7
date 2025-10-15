const fetch = require('node-fetch');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try {
    const tokenId = process.env.BOOKSTACK_TOKEN_ID;
    const tokenSecret = process.env.BOOKSTACK_TOKEN_SECRET;
    const apiUrl = process.env.BOOKSTACK_API_URL;
    const bookId = 1; // ID твоей книги

    const context = github.context;
    const issue = context.payload.issue;
    const action = context.payload.action;

    if (!issue) {
      console.log('No issue found in context');
      return;
    }

    const title = issue.title;
    const body = issue.body || '';
    console.log(`⚙️ Обработка issue: "${title}" (${action})`);

    // 🔍 Проверяем, есть ли уже страница с таким названием
    const searchRes = await fetch(`${apiUrl}/pages?search=${encodeURIComponent(title)}`, {
      headers: {
        'Authorization': `Token ${tokenId}:${tokenSecret}`,
        'Content-Type': 'application/json'
      }
    });
    const searchData = await searchRes.json();
    const existingPage = searchData.data?.find(p => p.name === title);

    // 🟢 1. Создание новой страницы
    if (action === 'opened' && !existingPage) {
      console.log('Создаем новую страницу...');
      const createRes = await fetch(`${apiUrl}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${tokenId}:${tokenSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: title,
          html: `
            <h2>Проблема</h2><p>${body}</p>
            <h2>Причина</h2><p>—</p>
            <h2>Решение</h2><p>—</p>
            <h2>Ссылки</h2><p><a href="${issue.html_url}">${issue.html_url}</a></p>
          `,
          book_id: bookId
        })
      });
      console.log('Создана страница:', await createRes.json());
      return;
    }

    // 🟡 2. Обновление страницы
    if (action === 'edited' && existingPage) {
      console.log(`Обновляем страницу ID=${existingPage.id}`);
      const updateRes = await fetch(`${apiUrl}/pages/${existingPage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${tokenId}:${tokenSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: title,
          html: `
            <h2>Проблема</h2><p>${body}</p>
            <h2>Обновлено:</h2><p>${new Date().toLocaleString()}</p>
            <h2>Ссылки</h2><p><a href="${issue.html_url}">${issue.html_url}</a></p>
          `
        })
      });
      console.log('Обновлено:', await updateRes.json());
      return;
    }

    // 🔴 3. Закрытие задачи → помечаем страницу
    if (action === 'closed' && existingPage) {
      console.log(`Помечаем страницу как закрытую ID=${existingPage.id}`);
      const closeRes = await fetch(`${apiUrl}/pages/${existingPage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${tokenId}:${tokenSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${title} (Закрыто)`,
          html: `
            <h2>Проблема</h2><p>${body}</p>
            <h2>Статус</h2><p>✅ Задача закрыта ${new Date().toLocaleString()}</p>
            <h2>Ссылки</h2><p><a href="${issue.html_url}">${issue.html_url}</a></p>
          `
        })
      });
      console.log('Закрыта:', await closeRes.json());
      return;
    }

    console.log('Нет действия для обработки или страница уже существует.');
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
})();
