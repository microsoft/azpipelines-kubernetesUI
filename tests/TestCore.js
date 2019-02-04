const React = require("react");
const Enzyme = require("enzyme");
const EnzymeAdapterReact16 = require("enzyme-adapter-react-16");
const EnzymeToJson = require("enzyme-to-json");

Enzyme.configure({
    adapter: new EnzymeAdapterReact16()
});

exports.shallow = function shallow(nextElement, options) {
    const wrapper = Enzyme.shallow(nextElement, {
        ...options
    });
    wrapper.toJson = function () {
        return EnzymeToJson.shallowToJson(this);
    };

    return wrapper;
};

exports.mount = function mount(nextElement, options) {
    const wrapper = Enzyme.mount(nextElement, {
        ...options
    });
    wrapper.toJson = function () {
        return EnzymeToJson.mountToJson(this);
    };

    return wrapper;
};

exports.render = function render(nextElement, options) {
    const wrapper = Enzyme.render(nextElement, {
        ...options
    });
    wrapper.toJson = function () {
        return EnzymeToJson.renderToJson(this);
    };

    return wrapper;
};

var spyConsole;
// beforeAll/afterAll will always fail last scenario [if there are any errors].
// beforeEach will help to find the scenario causing the issue.
beforeEach(() => {
    // react warnings are logged as console.error
    // so spying on error function of console.
    spyConsole = jest.spyOn(console, "error");
});

afterEach(() => {
    if (spyConsole) {
        expect(spyConsole).toHaveBeenCalledTimes(0);
        spyConsole.mockRestore();
    }

    spyConsole = null;
});

exports.spyConsole = spyConsole;