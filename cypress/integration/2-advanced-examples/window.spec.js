/// <reference types="cypress" />

context("Window", () => {
  beforeEach(() => {
    cy.visit("https://example.cypress.io/commands/window");
  });

  test("cy.window() - get the global window object", () => {
    // https://on.cypress.io/window
    cy.window().should("have.property", "top");
  });

  test("cy.document() - get the document object", () => {
    // https://on.cypress.io/document
    cy.document().should("have.property", "charset").and("eq", "UTF-8");
  });

  test("cy.title() - get the title", () => {
    // https://on.cypress.io/title
    cy.title().should("include", "Kitchen Sink");
  });
});
