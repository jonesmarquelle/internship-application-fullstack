addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const url = 'https://cfw-takehome.developers.workers.dev/api/variants'
const rewriter = new HTMLRewriter()
  .on('title', { text: t => changeText(t, 'Cool Title') })
  .on('h1#title', { text: t => changeText(t, 'Cloudflare Takehome Project') })
  .on('p#description', { text: t => changeText(t, '\"This was actually pretty fun.\"-Me, 2020') })
  .on('a',
    {
      element: e => changeLink(e, 'https://google.com'),
      text: t => changeText(t, 'Go to Google.com')
    });

/**
 * Changes current string inside text element to the one specified
 * @param {Text} text 
 * @param {string} newString 
 */
function changeText(text, newString) {
  if (!text.lastInTextNode) {
    text.remove()
  } else {
    text.replace(newString)
  }
}
/**
 * Changes current href URL of an element to the one specified
 * @param {Element} element 
 * @param {string} newLink 
 */
function changeLink(element, newLink) {
  element.setAttribute('href', newLink)
}

/**
 * Grabs the cookie with name from the request headers [From Wrangler templates]
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }
  return result
}

async function handleRequest(request) {
  const variantCookie = getCookie(request, "variant")
  const res1 = await fetch(url)
    .then(
      response => {
        if (response.status === 200) {
          return response.json();
        } else {
          console.log("Unable to request")
          throw Error(response.status)
        }
      })
    .catch(function (err) {
      console.error(err)
    });

  let res;
  const variantsArray = res1.variants
  if (variantCookie) {
    res = await fetch(variantsArray[parseInt(variantCookie)])
  } else {
    let rand = Math.floor(Math.random() * 10) % 2;
    let variantURL = variantsArray[rand]
    let tempRes = await fetch(variantURL)
    res = new Response(tempRes.body, tempRes)
    res.headers.set("Set-Cookie", `variant=${rand}`)
  }

  return rewriter.transform(res)
}