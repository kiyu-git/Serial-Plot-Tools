// window.URL.createObjectURL と revokeObjectURL をモックする
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();
