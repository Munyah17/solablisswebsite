// Solabliss services page — submitLead() lives in app.js
document.getElementById('servicesGrid').innerHTML =
  SERVICES.map(s => `<div class="svc"><div class="icon">${s[0]}</div><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('');
