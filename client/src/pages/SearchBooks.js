import React, { useState, useEffect } from 'react';
import { Jumbotron, Container, Col, Form, Button, Card, CardColumns } from 'react-bootstrap';

import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
//import useMutation Hook for SAVE_BOOK mutation use
import { useMutation } from '@apollo/client';
//import SAVE_BOOK mutation
import { SAVE_BOOK } from '../utils/mutations';
//TODO: Use Apollo useMutation() Hook to execute SAVE_BOOK mutation in handleSaveBook() instead of the saveBook() imported from the API file.
//TODO: Make sure keep the logic for saving the book's ID to state in the try...catch block!


const SearchBooks = () => {
  // create state using useState to hold returned google api data(searchedBooks)
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state via useState to hold search field data (searchedInput)
  const [searchInput, setSearchInput] = useState('');
  // create state via useState to hold saved bookId values (savedBookIds)
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());
  // implement SAVE_BOOK mutation to save books
  const [saveBook, { error }] = useMutation(SAVE_BOOK);

  // setup useEffect hook to save `savedBookIds` to localStorage on component unmount
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  });

  // method to search for books & set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // function to handle saving book to database
  const handleSaveBook = async (bookId) => {
    // find book in `searchedBooks` state by matching bookId
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

    // retrieve token & determine if login is authiticated
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await saveBook({ variables: bookToSave });

      // if book successfully saves, save bookId to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Jumbotron fluid className='text-light bg-dark'>
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Container>
      </Jumbotron>

      <Container>
        <h2>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <CardColumns>
          {searchedBooks.map((book) => {
            return (
              <Card key={book.bookId} border='dark'>
                {book.image ? (
                  <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                ) : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book.bookId)}>
                      {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </CardColumns>
      </Container>
      {error && <div> Something went wrong! </div>}
    </>
  );
};

export default SearchBooks;
