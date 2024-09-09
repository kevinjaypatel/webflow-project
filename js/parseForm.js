// parseForm.js
export function parseFormData(formData) {
    const data = {};
    formData.forEach((value, key) => {
        if (key == 'start-snapshot-ordinal' || key == 'end-snapshot-ordinal') {
            value = parseInt(value);         
        }
        data[key] = value;
    });

    console.log("Parsed Form Data: ", data);
    return data;
}
