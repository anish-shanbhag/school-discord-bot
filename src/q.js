const puppeteer = require("puppeteer");
async function login(id, password) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.goto("https://conejo.vcoe.org/studentconnect/");
  try {
    await page.waitFor("#page", {
      timeout: 3000
    });
  } catch {
    await page.waitFor("#loginlist > tbody > tr:nth-child(10) > td > a");
    await page.click("#loginlist > tbody > tr:nth-child(10) > td > a");
    await page.waitFor("#page");
  } finally {
    await page.type("#Pin", id);
    await page.type("#Password", password);
    await page.click("#LoginButton");
    return page;
  }
}
async function wait(page) {
  await page.waitFor(".sturow");
  await page.waitFor(1000);
  return page;
}
async function load(page) {
  await page.click(".sturow");
  await page.waitFor("#SP_Detail");
  await page.waitFor(() => !document.querySelector("#waitdiv"));
  return page;
}

const full = async (id, password) => await load(await wait(await login(id, password)));

module.exports = {
  login,
  wait,
  load,
  full
}