import React, { useReducer, useEffect } from "react";

import { validate } from "../../util/validators";
import "./Input.css"

const inputReducer = (state, action) => {
    if (action.type === "CHANGE") {
        return {
            ...state,
            value: action.val,
            isValid: validate(action.val, action.validators)
        };
    }
    if (action.type === "TOUCH") {
        return {
            ...state,
            isTouched: true
        }
    }
    return state;
};

const Input = (props) => {
    const [inputState, dispatch] =  useReducer(inputReducer, {
        value: props.initialValue || "",
        isValid: props.initialValid || false,
        isTouched: false
    });

    const {id, onInput} = props;
    const {value, isValid} = inputState;

    useEffect((props) => {
        onInput(id, value, isValid);
    }, [id, value, isValid, onInput]);

    const changeHandler = (event) => {
        dispatch({type: "CHANGE", val: event.target.value, validators: props.validators});
    };

    const touchHandler = () => {
        dispatch({type: "TOUCH"});
    };

    const element = props.element === 'input' ? (
        <input id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
        />
    ) : (
        <textarea id={props.id}
        rows={props.rows || 3}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
        />
    );

    return (
        <div className={`form-control ${!inputState.isValid && inputState.isTouched && "form-control--invalid"}`}>
            <label htmlFor={props.id}>
                {props.label}
            </label>
            {element}
            {!inputState.isValid && inputState.isTouched && <p>{props.errorText}</p>}
        </div>
    );
};

export default Input;