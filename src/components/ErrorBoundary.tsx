import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="page-container page-center">
      <h1 className="page-title">{t("error.title")}</h1>
      <p className="page-text">{t("error.text")}</p>
      <button type="button" className="page-button" onClick={() => location.reload()}>
        {t("error.reload")}
      </button>
    </div>
  );
}

// catches render errors below it, so one broken component
// doesn't turn the whole page white
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error); // send to Sentry etc. here if you use one
  }

  render() {
    return this.state.error ? <ErrorFallback /> : this.props.children;
  }
}
