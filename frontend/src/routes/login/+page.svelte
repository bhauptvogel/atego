<script lang="ts">
  import { goto } from "$app/navigation";
  import axios from "axios";
  import Cookies from "js-cookie";
  import { onMount } from "svelte";

  let usernameRegistration: string = "";
  let passwordRegistration: string = "";
  let confirmPasswordRegistration: string = "";

  let usernameLogin: string = "";
  let passwordLogin: string = "";

  let registerErrorMessage: string = "";
  let loginErrorMessage: string = "";

  function setUserTokenCookie(token: string): void {
    Cookies.set("user", token, { expires: 7 });
  }

  function getUserTokenCookie(): string | undefined {
    return Cookies.get("user");
  }

  function isRegistrationValid(): boolean {
    if (passwordRegistration !== confirmPasswordRegistration) {
      registerErrorMessage = "Passwords do not match!";
      return false;
    } else if (usernameRegistration === "" || passwordRegistration === "") {
      registerErrorMessage = "Username or Password is empty!";
      return false;
    } else if (usernameRegistration.length < 3) {
      registerErrorMessage = "Username is too short!";
      return false;
    } else if (passwordRegistration.length < 5) {
      registerErrorMessage = "Password is too short!";
      return false;
    }
    return true;
  }

  function isLoginValid(): boolean {
    if (usernameLogin === "") {
      loginErrorMessage = "Username is empty!";
      return false;
    } else if (passwordLogin == "") {
      loginErrorMessage = "Password is empty!";
      return false;
    }
    return true;
  }

  async function register() {
    registerErrorMessage = "";
    if (isRegistrationValid()) {
      // Implementation of registration logic...
      await axios
        .post(`${import.meta.env.VITE_SOCKET_ADRESS}/register`, {
          username: usernameRegistration,
          password: passwordRegistration,
        })
        .then((res) => {
          setUserTokenCookie(res.data.token);
          goto("account");
        })
        .catch((error) => {
          if (error.response.data.code === 11000) registerErrorMessage = "Username already taken!";
        });
    }
  }

  async function login() {
    loginErrorMessage = "";
    if (isLoginValid()) {
      await axios
        .post(`${import.meta.env.VITE_SOCKET_ADRESS}/login`, {
          username: usernameLogin,
          password: passwordLogin,
        })
        .then((res) => {
          setUserTokenCookie(res.data.token);
          goto("account");
        })
        .catch((error) => {
          if (error.response.data === "Authentication failed")
            loginErrorMessage = "Password is wrong!";
          else if (error.response.data === "User does not exist")
            loginErrorMessage = "Username does not exist!";
        });
    }
  }

  export async function load() {
    console.log("load");
    const token = getUserTokenCookie();
    if (token != undefined && !token.startsWith("guest")) {
      await axios
        .get(`${import.meta.env.VITE_SOCKET_ADRESS}/account`, {
          headers: {
            token: token,
          },
        })
        .then((res) => {
          goto("account");
        });
    }
  }
</script>

<div class="auth-container">
  <div class="register-container">
    <input
      class="input-field"
      type="text"
      bind:value={usernameRegistration}
      placeholder="Username"
    />

    <input
      class="input-field"
      type="password"
      bind:value={passwordRegistration}
      placeholder="Password"
    />
    <input
      class="input-field"
      type="password"
      bind:value={confirmPasswordRegistration}
      placeholder="Confirm Password"
    />
    <button on:click={register}>Register</button>
    <div style="margin-top: 10px; color: red;">
      {registerErrorMessage}
    </div>
  </div>
  <div class="login-container">
    <input class="input-field" type="text" bind:value={usernameLogin} placeholder="Username" />
    <input class="input-field" type="password" bind:value={passwordLogin} placeholder="Password" />
    <button on:click={login}>Login</button>
    <div style="margin-top: 10px; color: red;">
      {loginErrorMessage}
    </div>
  </div>
</div>

<style lang="scss">
  .auth-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }

  .login-container,
  .register-container {
    display: flex;
    flex-direction: column;
    padding: 40px;
    background-color: var(--color--component);
    color: var(--color--primary);
    max-width: 350px;
    margin: 50px auto;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .input-field {
    margin-bottom: 20px;
    padding: 15px;
    background-color: var(--color--component-darker);
    border: 1px solid var(--color--component-brighter);
    border-radius: 5px;
    color: var(--color--primary);
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: var(--color--primary);
    }
  }

  button {
    -webkit-appearance: none;
    appearance: none;
    opacity: 0.7;
    background: var(--color--component-darker);
    -webkit-transition: all 0.2s;
    transition: all 0.2s;
    font-weight: 600;
    font-size: 18px;
    color: var(--color--primary);
    padding: 15px;
    border: none;
    border-radius: 5px;
    margin-top: 5px;

    &:hover {
      opacity: 1;
      background-color: var(--color--component-brighter);
      transform: translateY(-2px);
    }

    &:active {
      background-color: var(--color--button-active);
      color: var(--color--app-background);
      transform: translateY(1px);
    }
  }
</style>
