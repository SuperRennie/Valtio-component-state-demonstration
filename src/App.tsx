import * as React from "react";
import { proxy, useSnapshot } from "valtio";
import { Clipboard, CheckCircle, XCircle, RefreshCw } from "react-feather";
import ReactTooltip from "react-tooltip";
import password from "generate-password";
import "./App.css";

type State = "idle" | "trying" | "success" | "failure";
type PasswordConfig = { numbers?: boolean; length?: number; symbols?: true };

class PasswordState {
  copyState: State = "idle";
  resetState: State = "idle";
  password: string;
  numbers: boolean = true;
  length: number = 20;
  symbols: boolean = true;

  constructor({ numbers, length, symbols }: PasswordConfig) {
    numbers = typeof numbers === "boolean" ? numbers : true;
    symbols = typeof symbols === "boolean" ? symbols : true;
    length = typeof length === "number" ? length : 20;
    this.generatePassword();
  }

  private generatePassword() {
    this.password = password.generate({
      numbers: this.numbers,
      length: this.length,
      symbols: this.symbols
    });
  }

  reset(state: "copyState" | "resetState") {
    setTimeout(() => {
      this[state] = "idle";
    }, 2000);
  }

  tryCopyToClipboard() {
    this.copyState = "trying";
    navigator.clipboard
      .writeText(this.password)
      .then(() => {
        this.copyState = "success";
      })
      .catch((e) => {
        this.copyState = "failure";
      })
      .finally(() => {
        this.reset("copyState");
      });
  }

  regeneratePassword() {
    this.resetState = "trying";
    this.generatePassword();
    this.resetState = "success";
    this.reset("resetState");
  }
}

/** use context to pass password state */
const PasswordButtonContext = React.createContext(undefined);

const PasswordGeneratorStateProvider = ({
  children,
  numbers,
  length,
  symbols
}) => {
  const state = React.useRef(
    proxy(new PasswordState({ numbers, length, symbols }))
  ).current;
  return (
    <PasswordButtonContext.Provider value={state}>
      {children}
    </PasswordButtonContext.Provider>
  );
};

// wrap in a custom hook for ease of use
function usePasswordGeneratorState() {
  // update state via methods passwordState
  const passwordState = React.useContext(PasswordButtonContext);
  const snapshot = useSnapshot<PasswordState>(passwordState);
  return { passwordState, snapshot };
}

const PasswordGeneratorComponent = () => {
  const { passwordState, snapshot: snap } = usePasswordGeneratorState();

  return (
    <div className="row">
      <div className="password">{snap.password}</div>
      <button
        className="icon-button"
        onClick={() => passwordState.regeneratePassword()}
        data-tip="New password"
      >
        {snap.resetState === "idle" && <RefreshCw width="12" />}
        {snap.resetState === "success" && <CheckCircle width="12" />}
      </button>
      <button
        className="icon-button"
        onClick={() => passwordState.tryCopyToClipboard()}
        data-tip="Copy to clipboard"
      >
        {(snap.copyState === "idle" || snap.copyState === "trying") && (
          <Clipboard width="12" />
        )}
        {snap.copyState === "success" && <CheckCircle width="12" />}
        {snap.copyState === "failure" && <XCircle width="12" />}
      </button>
      <ReactTooltip
        backgroundColor="var(--background-alt)"
        className="tooltip"
      />
    </div>
  );
};

const PasswordGenerator = ({ length, numbers, symbols }: PasswordConfig) => {
  return (
    <PasswordGeneratorStateProvider
      length={length}
      numbers={numbers}
      symbols={symbols}
    >
      <PasswordGeneratorComponent />
    </PasswordGeneratorStateProvider>
  );
};

const App = () => (
  <main>
    <h3>Valtio component state demonstration</h3>
    <section>
      <h5>Password</h5>
      <PasswordGenerator />
      <PasswordGenerator />
      <PasswordGenerator />
    </section>
  
  </main>
);

export default App;
