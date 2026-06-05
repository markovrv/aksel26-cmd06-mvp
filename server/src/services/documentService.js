// Генерация документов (договор, счёт, акт) в формате HTML для печати в PDF

export function generateContract(request) {
	const today = new Date().toLocaleDateString("ru-RU");
	const date = request.requested_date
		? new Date(request.requested_date).toLocaleDateString("ru-RU")
		: "___";
	const contractNumber = `Д-${request.id}-${new Date().getFullYear()}`;

	const totalPrice = request.base_price * request.people_count;
	const totalPriceText = numToWords(totalPrice);

	return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Договор № ${contractNumber}</title>
<style>
  @page { margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; }
  .doc-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
  .subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; }
  .header-line { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
  .section { margin-bottom: 15px; }
  .section-title { font-weight: bold; font-size: 15px; margin-bottom: 8px; text-align: center; }
  .section ul { padding-left: 20px; list-style: none; }
  .section ul li { margin-bottom: 4px; }
  .section ul li::before { content: "• "; }
  p { margin-bottom: 6px; text-indent: 0; }
  .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-block { width: 45%; }
  .signature-line { margin-top: 30px; border-top: 1px solid #000; padding-top: 5px; font-size: 13px; }
  .total-price { font-weight: bold; font-size: 15px; margin: 10px 0; }
  .bold { font-weight: bold; }
</style>
</head>
<body>
<div class="doc-container">

<h1>ДОГОВОР № ${contractNumber}</h1>
<div class="subtitle">на оказание экскурсионных услуг</div>

<div class="header-line">
  <span>г. Киров</span>
  <span>«${today}»</span>
</div>

<p><strong>${request.company_name || "ООО «ПромТур»"}</strong>, именуемое в дальнейшем «Исполнитель», в лице директора _____________________, и <strong>${request.user_name || "Заказчик"}</strong>, именуемое в дальнейшем «Заказчик», заключили настоящий Договор о нижеследующем.</p>

<div class="section">
  <div class="section-title">1. ПРЕДМЕТ ДОГОВОРА</div>
  <p>1.1. Исполнитель оказывает услуги по организации и проведению экскурсии: «${request.excursion_title || "Экскурсионные услуги"}».</p>
  <p>1.2. Место проведения: ${request.enterprise_name || "Предприятие"}, ${request.enterprise_address || "адрес уточняется"}.</p>
  <p>1.3. Дата и время проведения: ${date}, ${request.requested_time || "время согласовывается"}.</p>
  <p>1.4. Количество участников: <strong>${request.people_count}</strong> человек.</p>
  <p>1.5. Стоимость услуг по договору составляет: <span class="total-price">${totalPrice} (${totalPriceText}) рублей</span>.</p>
</div>

<div class="section">
  <div class="section-title">2. ОБЯЗАННОСТИ СТОРОН</div>
  <p><strong>2.1. Обязанности Исполнителя:</strong></p>
  <ul>
    <li>Предоставление экскурсионных услуг согласно программе;</li>
    <li>Обеспечение безопасности участников;</li>
    <li>Информирование об условиях проведения экскурсии.</li>
  </ul>
  <p><strong>2.2. Обязанности Заказчика:</strong></p>
  <ul>
    <li>Своевременная оплата услуг;</li>
    <li>Явка участников в указанное время и место;</li>
    <li>Ответственность за поведение участников.</li>
  </ul>
</div>

<div class="section">
  <div class="section-title">3. ПОРЯДОК РАСЧЁТОВ</div>
  <p>3.1. Заказчик оплачивает услуги в размере <strong>${totalPrice} рублей</strong> в течение 3 банковских дней с момента подписания договора.</p>
  <p>3.2. Оплата производится наличными или безналичным переводом на расчётный счёт Исполнителя.</p>
</div>

<div class="section">
  <div class="section-title">4. СРОК ДЕЙСТВИЯ ДОГОВОРА</div>
  <p>4.1. Договор вступает в силу с момента подписания и действует до окончания экскурсии.</p>
  <p>4.2. Договор может быть расторгнут по соглашению сторон или в одностороннем порядке с уведомлением за 24 часа.</p>
</div>

<div class="section">
  <div class="section-title">5. КОНТАКТЫ</div>
  <p><strong>Исполнитель:</strong> ${request.company_name || "ООО «ПромТур»"}</p>
  <p><strong>Заказчик:</strong> ${request.user_name}, тел.: ${request.user_phone || request.contact_phone || "-"}, email: ${request.user_email || request.contact_email || "-"}</p>
</div>

<div class="signatures">
  <div class="signature-block">
    <div class="signature-line">Исполнитель: _____________ / _________________ /</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Заказчик: _____________ / ${request.user_name || "Заказчик"} /</div>
  </div>
</div>

</div>
</body>
</html>`;
}

export function generateInvoice(request) {
	const today = new Date().toLocaleDateString("ru-RU");
	const invoiceNumber = `СЧЁТ-${request.id}-${new Date().getFullYear()}`;

	const unitPrice = request.base_price;
	const totalPrice = unitPrice * request.people_count;

	return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Счёт № ${invoiceNumber}</title>
<style>
  @page { margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; }
  .doc-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
  .invoice-date { text-align: center; font-size: 14px; margin-bottom: 25px; }
  .info-block { margin-bottom: 15px; }
  .info-block p { margin-bottom: 3px; }
  .info-label { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  table th, table td { border: 1px solid #000; padding: 8px 6px; text-align: center; font-size: 13px; }
  table th { font-weight: bold; background: #f0f0f0; }
  table td.left { text-align: left; }
  .total-row { font-weight: bold; font-size: 15px; text-align: right; margin-top: 10px; }
  .note { margin-top: 15px; font-size: 12px; color: #444; }
  .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-block { width: 45%; }
  .signature-line { margin-top: 30px; border-top: 1px solid #000; padding-top: 5px; font-size: 13px; }
</style>
</head>
<body>
<div class="doc-container">

<h1>СЧЁТ НА ОПЛАТУ № ${invoiceNumber}</h1>
<div class="invoice-date">от «${today}» г.</div>

<div class="info-block">
  <p><span class="info-label">Поставщик:</span> ${request.company_name || "ООО «ПромТур»"}</p>
  <p><span class="info-label">Адрес:</span> ${request.company_address || "г. Киров"}</p>
  <p><span class="info-label">ИНН:</span> ${request.company_inn || "0000000000"}</p>
  <p><span class="info-label">Банк:</span> ${request.company_bank || "Банк получателя"}</p>
</div>

<div class="info-block">
  <p><span class="info-label">Плательщик:</span> ${request.user_name || "Заказчик"}</p>
  <p><span class="info-label">Email:</span> ${request.user_email || request.contact_email || "-"}</p>
</div>

<table>
  <thead>
    <tr>
      <th style="width:40px">№</th>
      <th style="width:auto">Наименование услуги</th>
      <th style="width:80px">Кол-во</th>
      <th style="width:80px">Цена</th>
      <th style="width:100px">Сумма</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td class="left">
        Экскурсия «${request.excursion_title || "Экскурсионные услуги"}»<br>
        <span style="font-size:12px;color:#555;">${request.enterprise_name || "Предприятие"} | Дата: ${request.requested_date || "уточняется"}</span>
      </td>
      <td>${request.people_count}</td>
      <td>${unitPrice} ₽</td>
      <td>${totalPrice} ₽</td>
    </tr>
  </tbody>
</table>

<div class="total-row">ИТОГО К ОПЛАТЕ: ${totalPrice} руб.</div>
<p style="margin-top:5px;">(${numToWords(totalPrice)} рублей 00 коп.)</p>

<p class="note">В т.ч. НДС не облагается (упрощённая система налогообложения)</p>
<p class="note">Оплатить в течение 3 банковских дней.</p>

<div class="signatures">
  <div class="signature-block">
    <div class="signature-line">Руководитель: _____________ / _________________ /</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Бухгалтер: _____________ / _________________ /</div>
  </div>
</div>

</div>
</body>
</html>`;
}

export function generateAct(request) {
	const today = new Date().toLocaleDateString("ru-RU");
	const actNumber = `АКТ-${request.id}-${new Date().getFullYear()}`;

	const totalPrice = request.base_price * request.people_count;

	return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Акт № ${actNumber}</title>
<style>
  @page { margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; }
  .doc-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
  .subtitle { text-align: center; font-size: 14px; margin-bottom: 25px; }
  .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .info-grid > div { width: 48%; }
  .info-label { font-weight: bold; }
  .info-value { }
  .service-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .service-table th, .service-table td { border: 1px solid #000; padding: 8px 6px; text-align: center; font-size: 13px; }
  .service-table th { font-weight: bold; background: #f0f0f0; }
  .service-table td.left { text-align: left; }
  .total-amount { font-weight: bold; font-size: 16px; text-align: center; margin: 15px 0; }
  .declaration { margin: 15px 0; font-style: italic; }
  .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-block { width: 45%; }
  .signature-line { margin-top: 30px; border-top: 1px solid #000; padding-top: 5px; font-size: 13px; }
  .note { margin-top: 20px; font-size: 12px; text-align: center; color: #555; }
</style>
</head>
<body>
<div class="doc-container">

<h1>АКТ ВЫПОЛНЕННЫХ РАБОТ (УСЛУГ) № ${actNumber}</h1>
<div class="subtitle">от «${today}» г.</div>

<div class="info-grid">
  <div>
    <p><span class="info-label">Исполнитель:</span></p>
    <p class="info-value">${request.company_name || "ООО «ПромТур»"}</p>
  </div>
  <div>
    <p><span class="info-label">Заказчик:</span></p>
    <p class="info-value">${request.user_name || "Заказчик"}</p>
  </div>
</div>

<table class="service-table">
  <thead>
    <tr>
      <th style="width:40px">№</th>
      <th style="width:auto">Наименование услуги</th>
      <th style="width:100px">Кол-во</th>
      <th style="width:100px">Сумма</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td class="left">
        Экскурсия «${request.excursion_title || "Экскурсионные услуги"}»<br>
        <span style="font-size:12px;color:#555;">
          ${request.enterprise_name || "Предприятие"}, ${request.enterprise_address || "адрес уточняется"}
        </span>
      </td>
      <td>${request.people_count} чел.</td>
      <td>${totalPrice} ₽</td>
    </tr>
  </tbody>
</table>

<div class="total-amount">
  Всего оказано услуг на сумму: ${totalPrice} (${numToWords(totalPrice)}) рублей
</div>

<p><strong>Дата оказания:</strong> ${request.requested_date || "___"}</p>
<p><strong>Количество участников:</strong> ${request.people_count} человек</p>

<div class="declaration">
  <p>Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.</p>
</div>

<div class="signatures">
  <div class="signature-block">
    <div class="signature-line">Исполнитель: _____________ / _________________ /</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Заказчик: _____________ / ${request.user_name || "Заказчик"} /</div>
  </div>
</div>

<p class="note">Акт составлен в 2 экземплярах.</p>

</div>
</body>
</html>`;
}

// Функция преобразования числа в слова
function numToWords(num) {
	const units = [
		"",
		"один",
		"два",
		"три",
		"четыре",
		"пять",
		"шесть",
		"семь",
		"восемь",
		"девять",
	];
	const teens = [
		"десять",
		"одиннадцать",
		"двенадцать",
		"тринадцать",
		"четырнадцать",
		"пятнадцать",
		"шестнадцать",
		"семнадцать",
		"восемнадцать",
		"девятнадцать",
	];
	const tens = [
		"",
		"",
		"двадцать",
		"тридцать",
		"сорок",
		"пятьдесят",
		"шестьдесят",
		"семьдесят",
		"восемьдесят",
		"девяносто",
	];
	const hundreds = [
		"",
		"сто",
		"двести",
		"триста",
		"четыреста",
		"пятьсот",
		"шестьсот",
		"семьсот",
		"восемьсот",
		"девятьсот",
	];

	const thousand = (n) => {
		if (n >= 1000) {
			return (
				numToWords(Math.floor(n / 1000)) + " тысяч " + numToWords(n % 1000)
			);
		}
		return convertChunk(n);
	};

	const convertChunk = (n) => {
		if (n < 10) return units[n];
		if (n < 20) return teens[n - 10];
		if (n < 100)
			return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
		return (
			hundreds[Math.floor(n / 100)] +
			(n % 100 ? " " + convertChunk(n % 100) : "")
		);
	};

	const intPart = Math.floor(num);
	const result = intPart === 0 ? "ноль" : thousand(intPart);

	return result.charAt(0).toUpperCase() + result.slice(1);
}