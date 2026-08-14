import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { callGenericPopup, POPUP_RESULT, POPUP_TYPE } from '../../../popup.js';

const SETTINGS_KEY = 'vertexCustomModels';
const SELECT_ID = 'model_vertexai_select';

const select = document.getElementById(SELECT_ID);

if (!(select instanceof HTMLSelectElement)) {
    console.warn('[Vertex Custom Models] Google Vertex AI model selector was not found.');
} else {
    const savedSettings = extension_settings[SETTINGS_KEY];
    const settings = {
        models: normalizeModels(savedSettings?.models),
        selectedModel: typeof savedSettings?.selectedModel === 'string' ? savedSettings.selectedModel : '',
    };

    extension_settings[SETTINGS_KEY] = settings;

    const customModelsGroup = document.createElement('optgroup');
    customModelsGroup.label = 'Custom Vertex AI Models';
    customModelsGroup.dataset.vertexCustomModels = '';
    select.prepend(customModelsGroup);

    const heading = select.closest('div')?.querySelector('h4');
    if (heading) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.classList.add('addModel_button', 'menu_button', 'fa-solid', 'fa-fw', 'fa-pen-to-square');
        editButton.title = 'Custom Vertex AI models';
        editButton.setAttribute('aria-label', editButton.title);
        editButton.addEventListener('click', openModelEditor);
        heading.append(editButton);
    }

    renderCustomModels();
    restoreSelectedCustomModel();
    select.addEventListener('change', rememberSelectedCustomModel);

    async function openModelEditor() {
        const editor = document.createElement('div');

        const title = document.createElement('h3');
        title.textContent = 'Custom Vertex AI Models';
        editor.append(title);

        const hint = document.createElement('small');
        hint.textContent = 'Enter one Vertex AI model name per line.';
        editor.append(hint);

        const input = document.createElement('textarea');
        input.classList.add('text_pole');
        input.rows = 20;
        input.value = settings.models.join('\n');
        editor.append(input);

        const result = await callGenericPopup(editor, POPUP_TYPE.CONFIRM, '', {
            okButton: 'Save',
            cancelButton: 'Cancel',
        });

        if (result !== POPUP_RESULT.AFFIRMATIVE) {
            return;
        }

        const previouslySelectedModel = select.value;
        settings.models = normalizeModels(input.value.split('\n'));
        renderCustomModels();

        if (settings.models.includes(previouslySelectedModel)) {
            select.value = previouslySelectedModel;
        }

        settings.selectedModel = settings.models.includes(select.value) ? select.value : '';
        extension_settings[SETTINGS_KEY] = settings;
        saveSettingsDebounced();
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function renderCustomModels() {
        customModelsGroup.replaceChildren(...settings.models.map(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            return option;
        }));

        customModelsGroup.hidden = settings.models.length === 0;
    }

    function restoreSelectedCustomModel() {
        if (!settings.models.includes(settings.selectedModel)) {
            return;
        }

        select.value = settings.selectedModel;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function rememberSelectedCustomModel() {
        const selectedModel = settings.models.includes(select.value) ? select.value : '';
        if (settings.selectedModel === selectedModel) {
            return;
        }

        settings.selectedModel = selectedModel;
        extension_settings[SETTINGS_KEY] = settings;
        saveSettingsDebounced();
    }
}

function normalizeModels(models) {
    if (!Array.isArray(models)) {
        return [];
    }

    return [...new Set(models.map(model => String(model).trim()).filter(Boolean))];
}
