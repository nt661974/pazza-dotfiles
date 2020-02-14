'''
Initial call to BaseHTTPRequestHandler in module server crash the application because bz2 is needed and his librarity _bz2 is not included in LibreOffice.
Therefore, we copy BaseHTTPRequestHandler from Python 3.5.2. This class is only used for Python version > 3, for LibreOffice.
However, other modules as http.client or mail are needed. So we call it in LibreOffice. (Dangerous).
The wwebsocket should need to have less depencies as possible.

But other libraries as base64 have also dependencies.
'''

__version__ = "0.6"

import sys
import socketserver
import http.client

# Default error message template
DEFAULT_ERROR_MESSAGE = """\
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
        "http://www.w3.org/TR/html4/strict.dtd">
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
        <title>Error response</title>
    </head>
    <body>
        <h1>Error response</h1>
        <p>Error code: %(code)d</p>
        <p>Message: %(message)s.</p>
        <p>Error code explanation: %(code)s - %(explain)s.</p>
    </body>
</html>
"""

DEFAULT_ERROR_CONTENT_TYPE = "text/html;charset=utf-8"

class BaseHTTPRequestHandler(socketserver.StreamRequestHandler):

    """HTTP request handler base class.

    The following explanation of HTTP serves to guide you through the
    code as well as to expose any misunderstandings I may have about
    HTTP (so you don't need to read the code to figure out I'm wrong
    :-).

    HTTP (HyperText Transfer Protocol) is an extensible protocol on
    top of a reliable stream transport (e.g. TCP/IP).  The protocol
    recognizes three parts to a request:

    1. One line identifying the request type and path
    2. An optional set of RFC-822-style headers
    3. An optional data part

    The headers and data are separated by a blank line.

    The first line of the request has the form

    <command> <path> <version>

    where <command> is a (case-sensitive) keyword such as GET or POST,
    <path> is a string containing path information for the request,
    and <version> should be the string "HTTP/1.0" or "HTTP/1.1".
    <path> is encoded using the URL encoding scheme (using %xx to signify
    the ASCII character with hex code xx).

    The specification specifies that lines are separated by CRLF but
    for compatibility with the widest range of clients recommends
    servers also handle LF.  Similarly, whitespace in the request line
    is treated sensibly (allowing multiple spaces between components
    and allowing trailing whitespace).

    Similarly, for output, lines ought to be separated by CRLF pairs
    but most clients grok LF characters just fine.

    If the first line of the request has the form

    <command> <path>

    (i.e. <version> is left out) then this is assumed to be an HTTP
    0.9 request; this form has no optional headers and data part and
    the reply consists of just the data.

    The reply form of the HTTP 1.x protocol again has three parts:

    1. One line giving the response code
    2. An optional set of RFC-822-style headers
    3. The data

    Again, the headers and data are separated by a blank line.

    The response code line has the form

    <version> <responsecode> <responsestring>

    where <version> is the protocol version ("HTTP/1.0" or "HTTP/1.1"),
    <responsecode> is a 3-digit response code indicating success or
    failure of the request, and <responsestring> is an optional
    human-readable string explaining what the response code means.

    This server parses the request and the headers, and then calls a
    function specific to the request type (<command>).  Specifically,
    a request SPAM will be handled by a method do_SPAM().  If no
    such method exists the server sends an error response to the
    client.  If it exists, it is called with no arguments:

    do_SPAM()

    Note that the request name is case sensitive (i.e. SPAM and spam
    are different requests).

    The various request details are stored in instance variables:

    - client_address is the client IP address in the form (host,
    port);

    - command, path and version are the broken-down request line;

    - headers is an instance of email.message.Message (or a derived
    class) containing the header information;

    - rfile is a file object open for reading positioned at the
    start of the optional input data part;

    - wfile is a file object open for writing.

    IT IS IMPORTANT TO ADHERE TO THE PROTOCOL FOR WRITING!

    The first thing to be written must be the response line.  Then
    follow 0 or more header lines, then a blank line, and then the
    actual data (if any).  The meaning of the header lines depends on
    the command executed by the server; in most cases, when data is
    returned, there should be at least one header line of the form

    Content-type: <type>/<subtype>

    where <type> and <subtype> should be registered MIME types,
    e.g. "text/html" or "text/plain".

    """

    # The Python system version, truncated to its first component.
    sys_version = "Python/" + sys.version.split()[0]

    # The server software version.  You may want to override this.
    # The format is multiple whitespace-separated strings,
    # where each string is of the form name[/version].
    server_version = "BaseHTTP/" + __version__

    error_message_format = DEFAULT_ERROR_MESSAGE
    error_content_type = DEFAULT_ERROR_CONTENT_TYPE

    # The default request version.  This only affects responses up until
    # the point where the request line is parsed, so it mainly decides what
    # the client gets back when sending a malformed request line.
    # Most web servers default to HTTP 0.9, i.e. don't send a status line.
    default_request_version = "HTTP/0.9"

    def parse_request(self):
        """Parse a request (internal).

        The request should be stored in self.raw_requestline; the results
        are in self.command, self.path, self.request_version and
        self.headers.

        Return True for success, False for failure; on failure, an
        error is sent back.

        """
        self.command = None  # set in case of error on the first line
        self.request_version = version = self.default_request_version
        self.close_connection = True
        requestline = str(self.raw_requestline, 'iso-8859-1')
        requestline = requestline.rstrip('\r\n')
        self.requestline = requestline
        words = requestline.split()
        if len(words) == 3:
            command, path, version = words
            if version[:5] != 'HTTP/':
                self.send_error(
                    HTTPStatus.BAD_REQUEST,
                    "Bad request version (%r)" % version)
                return False
            try:
                base_version_number = version.split('/', 1)[1]
                version_number = base_version_number.split(".")
                # RFC 2145 section 3.1 says there can be only one "." and
                #   - major and minor numbers MUST be treated as
                #      separate integers;
                #   - HTTP/2.4 is a lower version than HTTP/2.13, which in
                #      turn is lower than HTTP/12.3;
                #   - Leading zeros MUST be ignored by recipients.
                if len(version_number) != 2:
                    raise ValueError
                version_number = int(version_number[0]), int(version_number[1])
            except (ValueError, IndexError):
                self.send_error(
                    HTTPStatus.BAD_REQUEST,
                    "Bad request version (%r)" % version)
                return False
            if version_number >= (1, 1) and self.protocol_version >= "HTTP/1.1":
                self.close_connection = False
            if version_number >= (2, 0):
                self.send_error(
                    HTTPStatus.HTTP_VERSION_NOT_SUPPORTED,
                    "Invalid HTTP Version (%s)" % base_version_number)
                return False
        elif len(words) == 2:
            command, path = words
            self.close_connection = True
            if command != 'GET':
                self.send_error(
                    HTTPStatus.BAD_REQUEST,
                    "Bad HTTP/0.9 request type (%r)" % command)
                return False
        elif not words:
            return False
        else:
            self.send_error(
                HTTPStatus.BAD_REQUEST,
                "Bad request syntax (%r)" % requestline)
            return False
        self.command, self.path, self.request_version = command, path, version

        # Examine the headers and look for a Connection directive.
        try:
            self.headers = http.client.parse_headers(self.rfile,
                                                     _class=self.MessageClass)
        except http.client.LineTooLong:
            self.send_error(
                HTTPStatus.BAD_REQUEST,
                "Line too long")
            return False
        except http.client.HTTPException as err:
            self.send_error(
                HTTPStatus.REQUEST_HEADER_FIELDS_TOO_LARGE,
                "Too many headers",
                str(err)
            )
            return False

        conntype = self.headers.get('Connection', "")
        if conntype.lower() == 'close':
            self.close_connection = True
        elif (conntype.lower() == 'keep-alive' and
              self.protocol_version >= "HTTP/1.1"):
            self.close_connection = False
        # Examine the headers and look for an Expect directive
        expect = self.headers.get('Expect', "")
        if (expect.lower() == "100-continue" and
                self.protocol_version >= "HTTP/1.1" and
                self.request_version >= "HTTP/1.1"):
            if not self.handle_expect_100():
                return False
        return True

    # The version of the HTTP protocol we support.
    # Set this to HTTP/1.1 to enable automatic keepalive
    protocol_version = "HTTP/1.0"

    # MessageClass used to parse headers
    MessageClass = http.client.HTTPMessage

