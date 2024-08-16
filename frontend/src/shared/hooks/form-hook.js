import { useCallback, useReducer } from "react";

const formReducer = (state, action) => {
    if (action.type === "INPUT_CHANGE") {
        let formIsValid = true;
        for (const inputId in state.inputs) {
            if (!state.inputs[inputId]) {
                continue;
            }
            if (inputId === action.inputId) {
                formIsValid = formIsValid && action.isValid;
            }
            else {
                formIsValid = formIsValid && state.inputs[inputId].isValid;
            }
        }
        return {
            ...state,
            inputs : {
                ...state.inputs,
                [action.inputId]: {value: action.value, isValid: action.isValid}
            },
            isValid: formIsValid
        };
    }

    if (action.type === "SET_DATA") {
        return {
            inputs: action.inputs,
            isValid: action.formIsValid
        };
    }

    return state;
};

export const useForm = (initialInputs, initialFormValidity) => {
    const [formState, dispatch] =  useReducer(formReducer, {
        inputs: initialInputs,
        isValid: initialFormValidity
    });

    const InputHandler = useCallback((id, value, isValid) => {
        dispatch({type: "INPUT_CHANGE", inputId: id, value: value, isValid: isValid})
    }, []);

    const setFormData = useCallback((inputData, formValidity) => {
        dispatch({
            type: "SET_DATA",
            inputs: inputData,
            formIsValid: formValidity
        });
    }, []);

    return [formState, InputHandler, setFormData];
};

