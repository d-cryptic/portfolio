import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
  shortcuts: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const shortcuts = opts?.shortcuts ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          <a href="https://barundebnath.com">
            🕹 {i18n(cfg.locale).components.footer.createdWith}{" "}
          </a>{" "}
          © {year}
          <p>Follow me at: </p>
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
        <p>
          <p>Read more at: </p>
        </p>
        <ul>
          {Object.entries(shortcuts).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
