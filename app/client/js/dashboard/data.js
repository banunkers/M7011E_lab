/**
 * Fetches data of a prosumer or manager
 * @returns an object with attributes me and pricing
 */
async function getData() {
  const GET_DATA_QUERY = `{
		me {
			... on prosumer {
				... prosumerFields
			},
			... on manager {
				... managerFields
			}
		}
		pricing
	}
	${prosumerFields},
	${managerFields}
	`;
  let data = null;
  try {
    await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        query: GET_DATA_QUERY
      })
    })
      .then(res => res.json())
      .then(res => (data = res.data));
  } catch (err) {
    console.error(`Failed to get user data: ${err}`);
  }
  return data;
}
