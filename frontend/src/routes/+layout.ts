import type { LayoutLoad } from "./$types";
import Cookies from "js-cookie";
import axios from "axios";
export const ssr = false;

export const load: LayoutLoad = async ({ params }) => {
  const token = Cookies.get("user");
  if (token == undefined || token.startsWith("guest")) {
    return null;
  }
  let username = null;
  await axios
    .get(`${import.meta.env.VITE_SOCKET_ADRESS}/account`, {
      headers: {
        token: token,
      },
    })
    .then((res) => {
      username = res.data;
    })
    .catch((error) => {
      console.error(error);
      Cookies.remove("user"); // if token is expired or not valid
    });
  return { username: username };
};
