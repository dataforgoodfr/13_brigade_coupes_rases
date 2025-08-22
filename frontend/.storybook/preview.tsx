import type { Preview } from "@storybook/react-vite";
import "../src/index.css";
import { IntlProvider } from "react-intl";
const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [(Story) => {
		return <IntlProvider locale="fr"><Story/></IntlProvider>
	}],
};

export default preview;
