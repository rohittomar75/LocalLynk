import React, { useState, useContext } from "react";

import Card from "../../shared/components/UIElements/Card";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import { VALIDATOR_REQUIRE, VALIDATOR_EMAIL, VALIDATOR_MINLENGTH } from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import { AuthContext } from "../../shared/context/auth-context";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";
import ImageUpload from "../../shared/components/FormElements/ImageUpload";
import "./Auth.css"

const Auth = (props) => {
    const auth = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const { isLoading, error, sendRequest, clearError } = useHttpClient();

    const [formState, InputHandler, setFormData] = useForm({
        email: {
            value: "",
            isValid: false
        },
        password: {
            value: "",
            isValid: false
        }
    }, false);

    const switchModeHandler = () => {
        if (!isLoginMode) {
            setFormData(
                {
                    ...formState.inputs,
                    name: undefined,
                    image: undefined
                },
                formState.inputs.email.isValid && formState.inputs.password.isValid
            )
        }
        else {
            setFormData(
                {
                    ...formState.inputs,
                    name: {
                        value: "",
                        isValid: false
                    },
                    image: {
                        value: null,
                        isValid: false
                    }
                },
                false
            )
        }
        setIsLoginMode(prevMode => !prevMode);
    };

    const authSubmitHandler = async (event) => {
        event.preventDefault();
        // console.log(formState.inputs);
        if (isLoginMode) {
            try {
                const responseData = await sendRequest(
                    process.env.REACT_APP_BACKEND_URL + "/users/login",
                    "POST",
                    JSON.stringify(
                        {
                            email: formState.inputs.email.value,
                            password: formState.inputs.password.value
                        }
                    ),
                    {
                        "Content-Type": "application/json"
                    }
                );
                auth.login(responseData.userId, responseData.token);
            } catch (err) {
                // 
            }

            // console.log(responseData);
        }
        else {
            try {
                const formData = new FormData();
                formData.append("name", formState.inputs.name.value);
                formData.append("email", formState.inputs.email.value);
                formData.append("password", formState.inputs.password.value);
                formData.append("image", formState.inputs.image.value);
                const responseData = await sendRequest(
                    process.env.REACT_APP_BACKEND_URL + "/users/signup",
                    "POST",
                    formData
                    // JSON.stringify(
                    //     {
                    //         name: formState.inputs.name.value,
                    //         email: formState.inputs.email.value,
                    //         password: formState.inputs.password.value
                    //     }
                    // ),
                    // {
                    //     "Content-Type": "application/json"
                    // }
                );

                // console.log(responseData);

                auth.login(responseData.userId, responseData.token);
            } catch (err) {
                // 
            }
        }
    };

    return (
        <>
            <ErrorModal error={error} onClear={clearError}/>
            <Card className="authentication">
                {isLoading && <LoadingSpinner asOverlay />}
                <h2>Login Required</h2>
                <hr/>
                <form onSubmit={authSubmitHandler}>
                    {!isLoginMode && <Input 
                        element="input"
                        id="name"
                        type="text"
                        label="Name"
                        validators={[VALIDATOR_REQUIRE()]}
                        errorText="Please enter a name"
                        onInput={InputHandler}
                    />}
                    {!isLoginMode && <ImageUpload center id="image" onInput={InputHandler} errorText="please provide an image" />}
                    <Input 
                        element="input"
                        id="email"
                        type="email"
                        label="Email"
                        validators={[VALIDATOR_EMAIL()]}
                        errorText="Please enter a valid email address"
                        onInput={InputHandler}
                    />
                    <Input 
                        element="input"
                        id="password"
                        type="password"
                        label="Password"
                        validators={[VALIDATOR_MINLENGTH(6)]}
                        errorText="Please enter a valid Password (atleast 6 characters)"
                        onInput={InputHandler}
                    />
                    <Button type="submit" disabled={!formState.isValid}>
                        {isLoginMode ? "Login" : "Signup"}
                    </Button>
                </form>
                <Button inverse onClick={switchModeHandler}>
                    Switch to {isLoginMode ? "Signup" : "Login"}
                </Button>
            </Card>
        </>
    );
};

export default Auth;