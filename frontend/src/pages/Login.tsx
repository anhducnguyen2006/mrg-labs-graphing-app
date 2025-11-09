import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Text,
    useToast,
    VStack,
    Link as ChakraLink,
    InputGroup,
    InputRightElement,
    IconButton,
    Alert,
    AlertIcon,
    AlertDescription,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            await login(username, password);
            toast({
                title: 'Login Successful',
                description: `Welcome back, ${username}!`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            toast({
                title: 'Login Failed',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
            <Container maxW="md" py={12}>
                <VStack spacing={8} bg="white" p={8} borderRadius="lg" boxShadow="xl">
                    {/* Logo/Header */}
                    <VStack spacing={2}>
                        <Heading size="xl" color="blue.600">
                            MRG Labs
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Graphing Application
                        </Text>
                    </VStack>

                    {/* Login Form */}
                    <Box w="100%">
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={4}>
                                <Heading size="md" textAlign="center">
                                    Sign In
                                </Heading>

                                {error && (
                                    <Alert status="error" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription fontSize="sm">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <FormControl isRequired>
                                    <FormLabel>Username</FormLabel>
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        size="lg"
                                        autoFocus
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Password</FormLabel>
                                    <InputGroup size="lg">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                        />
                                        <InputRightElement>
                                            <IconButton
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                onClick={() => setShowPassword(!showPassword)}
                                                variant="ghost"
                                                size="sm"
                                            />
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>

                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    size="lg"
                                    fontSize="md"
                                    isLoading={isLoading}
                                    loadingText="Signing in..."
                                    w="100%"
                                >
                                    Sign In
                                </Button>
                            </Stack>
                        </form>
                    </Box>

                    {/* Sign Up Link */}
                    <Text color="gray.600" fontSize="sm">
                        Don't have an account?{' '}
                        <ChakraLink as={Link} to="/signup" color="blue.600" fontWeight="semibold">
                            Sign Up
                        </ChakraLink>
                    </Text>
                </VStack>
            </Container>
        </Box>
    );
};

export default Login;
