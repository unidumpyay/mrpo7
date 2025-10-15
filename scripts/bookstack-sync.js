const fetch = require('node-fetch');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try {
    const tokenId = process.env.BOOKSTACK_TOKEN_ID;
    const tokenSecret = process.env.BOOKSTACK_TOKEN_SECRET;
    const apiUrl = process.env.BOOKSTACK_API_URL;

    const context = github.context;
    const issue = context.payload.issue;

    if (!issue) {
      console.log('No issue found');
      return;
    }

    const title = issue.title;
    const body = issue.body;

    // Простой пример: создаем страницу в BookStack
    const res = await fetch(`${apiUrl}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${tokenId}:${tokenSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: title,
        html: `<h2>Проблема</h2><p>${body}</p>`,
        book_id: 1 // ID книги, куда создавать страницу
      })
    });

    const data = await res.json();
    console.log('Response from BookStack:', data);
  } catch (err) {
    console.error(err);
  }
})();
