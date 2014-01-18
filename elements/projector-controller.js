(function() {
  Polymer('projector-controller', {
    initialized: false,
    verseNotSet: true,
    pageSize: 3,
    bgFile: 'black',
    fontSize: 40,
    previewTitle: '<closed>',
    nVolume: 1,
    startVerseSub: 0,
    indOfFirstVerseOfThisVol: 0,
    indOfLastVerseOfThisVol: 0,
    projWin: -1,
    projectorClosed: true,

    versionCUN: true,   // Chinese Union Verseion
    versionKJV: true,

    backgroundSettings: [
        {selected: false, label: 'Black', value: 'black'},
        {selected: false, label: 'White', value: 'white'},
        {selected: false, label: 'Brgt1', value: 'bgBright1.jpeg'},
        {selected: false, label: 'Brgt2', value: 'bgBright2.jpeg'},
        {selected: false, label: 'Brgt3', value: 'bgBright3.jpeg'},
        {selected: false, label: 'Brgt4', value: 'bgBright4.jpeg'},
        {selected: false, label: 'Dark1', value: 'bgDark1.jpeg'},
        {selected: false, label: 'Dark2', value: 'bgDark2.jpeg'},
        {selected: false, label: 'Dark3', value: 'bgDark3.jpeg'},
        {selected: false, label: 'Dark4', value: 'bgDark4.jpeg'}
      ],

    syncPreview: false,
    syncPreviewChanged: function() {
      if( !this.projectorClosed && this.syncPreview ) {
        var evt = new VerseEvent( this.nVolume, this.startVerseSub );
        this.fire( 'preview-verse', {verseEvent: evt} );
      }
    },

    ready: function() {
      if( !this.$.storage.value || !this.$.storage.value.bgFile )
        return;
      this.bgFile = this.$.storage.value.bgFile;
      for( var ind=0; ind<this.backgroundSettings.length; ind++ ) {
        if( this.backgroundSettings[ind].value != this.bgFile )
          continue;
        this.backgroundSettings[ind].selected = true;
        break;
      }
    },

    defaultVerSelected: function() {
      var chkNeedsClick;
      if( this.initialized ) {
        if( defaultVer == VER_CUN ) {
          this.versionCUN = true;
          chkNeedsClick = this.$.chkVersionKJV;
        } else if( defaultVer == VER_KJV ) {
          this.versionKJV = true;
          chkNeedsClick = this.$.chkVersionCUN;
        }
      } else {
        this.initialized = true;
        if( defaultVer == VER_CUN )
          this.$.chkVersionKJV.click();
        else
          this.$.chkVersionCUN.click();
      }

      var projCtr = this;
      var timer = window.setInterval( function() {
        window.clearInterval( timer );
        if( chkNeedsClick )
          chkNeedsClick.click();
        if( !projCtr.projectorClosed )
          projCtr._projectVerse();
      }, 1 );
    },

    openProjector: function( evt ) {
      this._projectVerse();
    },

    closeProjector: function( evt ) {
      if( this.isProjectorOpen() ) {
        this._afterProjWinClosed();
      }
    },

    _afterProjWinClosed: function() {
      if( this.projWin.close ) this.projWin.close();
      this.projWin = -1
      this.projectorClosed = true;
      this.$.closeBtn.value = 'Open';
      this.$.closeBtn.title = 'Open the projector window';
    },

    projectVerse: function( verseEvent ) {
      this.nVolume = verseEvent.volume;
      this.verseNotSet = false;
      this.startVerseSub = verseEvent.verseSub;

      var cumNumOfChpNextVol = CumNumOfChpPerVol[this.nVolume];
      this.indOfFirstVerseOfThisVol = CumNumOfVrsPerChp[ CumNumOfChpPerVol[this.nVolume-1] ];
      this.indOfLastVerseOfThisVol  = CumNumOfVrsPerChp[cumNumOfChpNextVol] - 1;

      this._projectVerse();
    },

    _projectVerse: function() {
      this.previewTitle = getTitleFromVerseSub( this.nVolume, this.startVerseSub );
      if( !this.isProjectorOpen() ) {
        var projWinFeatures = 'scrollbars=yes';
        this.projWin = window.open( 'blank.html', 'projector', projWinFeatures );
      }
      var docObj = this.projWin.document;
      docObj.open();
      var foreColor = 'WHITE';
      if( this.bgFile=='white' || this.bgFile.indexOf('bgBright')>=0 ) {
        foreColor = 'BLACK';
      }
      var bg = 'background: url(images/' + this.bgFile + ') no-repeat center center fixed;';
      if( this.bgFile=='white' || this.bgFile=='black' )
        bg = 'background-color: ' + this.bgFile + ';';
      docObj.writeln(
          '<!DOCTYPE HTML>\n<HEAD>\n<TITLE>Verse projection</TITLE>\n'
        + '<meta http-equiv="Content-Type" content="text/html; charset=big5"/>\n'
        + '<style type="text/css">\n'
        + 'body { color: ' + foreColor + ';'
        + '   font-size: ' + this.fontSize + 'pt; font-weight: bolder; padding-left: 0.5em; padding-right: 0.5em}\n'
        + 'html {  ' + bg
        + '  -webkit-background-size: cover;\n'
        + '  -moz-background-size: cover;\n'
        + '  -o-background-size: cover;\n'
        + '  background-size: cover;\n'
        +'}\n'
        + '.aquo {\n'
        + '   font-family: monospace;\n'
        + '   -webkit-transform: scale(0.5,2);\n'
        + '   font-size: 150%;\n'
        + '}\n'
        + '</style>\n'
        + '</HEAD>\n<BODY>\n');
      var versionList = new Array();
      if( this.versionCUN )
        versionList.push( 'CUN' );
      if( this.versionKJV )
        versionList.push( 'KJV' );

      docObj.writeln( this.getVerseTextForDisplay(versionList, foreColor)  );
      docObj.writeln( '\n</BODY>\n</HTML>' );
      docObj.close();
      this.projectorClosed = false;
      this.$.closeBtn.value = 'Close';
      this.$.closeBtn.title = 'Close the projector window';

      var projectorControllerThis = this;
      var timer = window.setInterval( function() {
          if( projectorControllerThis.checkProjectWin() ) {
            window.clearInterval( timer );
          }
        }, 500
      );

      if( this.syncPreview ) {
        var evt = new VerseEvent( this.nVolume, this.startVerseSub );
        this.fire( 'preview-verse', {verseEvent: evt} );
      }
    },

    checkProjectWin: function() {
      if( !this.isProjectorOpen() ) {
        this._afterProjWinClosed();
      }
      return this.projectorClosed;
    },

    getVerseTextForDisplay: function( versionList, foreColor ) {
      var volume = this.nVolume;
      var pageSize = this.pageSize;
      var verseSub = this.startVerseSub;
      versionList = versionList || new Array( defaultVer );
      foreColor = foreColor || 'black';
      var cumNumOfChpNextVol = CumNumOfChpPerVol[volume];
      var indOfFirstVerseOfThisVol = CumNumOfVrsPerChp[ CumNumOfChpPerVol[volume-1] ];
      var indOfLastVerseOfThisVol  = CumNumOfVrsPerChp[cumNumOfChpNextVol] - 1;
      var verseTextBuf = '';

      versionList.forEach( function(version) {
        var currChapter = '';
        for( var cnt=0; cnt<pageSize && verseSub+cnt<=indOfLastVerseOfThisVol; cnt++ ) {
          var nextVerse = BibleByVer[version][ verseSub + cnt ];
          var colonInd = nextVerse.indexOf( ':' );
          var spaceInd = nextVerse.indexOf( ' ' );
          var nextChapter = nextVerse.substring( 0, colonInd ).match( /\d+$/ )[0];
          var verseNum  = nextVerse.substring( colonInd+1, spaceInd );
          var verseText = nextVerse.substring( spaceInd+1 );
          if( currChapter != nextChapter ) {
            if( currChapter != '' )
              verseTextBuf += '</P>';
            currChapter = nextChapter;
            verseTextBuf +=
              '<P><b><span class="aquo">&laquo;</span>'
              + getVolumeChapterText(volume, currChapter, version) + '<span class="aquo">&raquo;</span></b>&nbsp;&nbsp; ';
          }
          verseTextBuf +=  '&nbsp; <sup style="font-size:70%;">' + verseNum + '</sup> ' + verseText;
        }
        verseTextBuf += '</P>';
      });

      return verseTextBuf;
    },

    applySetting: function( evt ) {
      this._projectVerse();
    },

    pageSizeSelectionChanged: function( evt ) {
      this.pageSize =   parseInt( evt.target.value );
    },

    bgSelectionChanged: function( evt ) {
      this.bgFile =   evt.target.value;
      this.$.storage.value = {bgFile: this.bgFile};
    },

    viewPreviousPage: function() {
      if( !this.isProjectorOpen() ) {
        this.projectorClosed = true;
        return;
      }
      if( this.startVerseSub <= this.indOfFirstVerseOfThisVol  ) {
        return;
      } else if( this.startVerseSub - this.pageSize <= this.indOfFirstVerseOfThisVol){
        this.startVerseSub = this.indOfFirstVerseOfThisVol;
      } else {
        this.startVerseSub -= this.pageSize;
      }
      this._projectVerse();
    },

    viewNextPage: function() {
      if( !this.isProjectorOpen() ) {
        this.projectorClosed = true;
        return;
      }
      if( this.nVolume>66 ) {
        return;
      }
      if( this.startVerseSub + this.pageSize > this.indOfLastVerseOfThisVol  ) {
        return;
      }
      this.startVerseSub += this.pageSize;
      this._projectVerse();
    },

    bookmarkVerse: function() {
      var evt = new VerseEvent( this.nVolume, this.startVerseSub );
      this.fire( 'bookmark-verse', {verseEvent: evt} );
    },

    smallerFont: function() {
      if( !this.isProjectorOpen() ) {
        this.projectorClosed = true;
        return;
      }
      this.fontSize -= 2;
      this._projectVerse();
    },
    largerFont: function() {
      if( !this.isProjectorOpen() ) {
        this.projectorClosed = true;
        return;
      }
      this.fontSize += 2;
      this._projectVerse();
    },

    isProjectorOpen: function() {
      return this.projWin != -1 && this.projWin.document;
    },

  });
})();
