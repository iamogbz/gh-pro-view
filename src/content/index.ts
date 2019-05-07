import "webext-dynamic-content-scripts";

import { initAll, onAjaxedPagesRaw } from "features";
import "features/extend-file-preview-html";
import "features/extend-file-types-filter";

onAjaxedPagesRaw(initAll);
